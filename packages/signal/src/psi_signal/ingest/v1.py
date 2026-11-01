"""Ingest Format v1 어댑터 (docs/ARCHITECTURE.md 참고)."""

import json
import zipfile
from pathlib import Path

import numpy as np
import pandas as pd

from psi_signal.ingest.adapters import register_adapter
from psi_signal.ingest.models import (
    UTC_MISSING,
    GnssData,
    ImuData,
    IngestError,
    IngestIssue,
    Manifest,
    ParsedSession,
    PedalData,
    SyncMarkers,
    VideoStream,
)
from psi_signal.ingest.quality import gap_stats

FORMAT_ID = "psi-ingest-v1"
MANIFEST_MEMBER = "manifest.json"
MANIFEST_KEYS = (
    "format",
    "session_id",
    "device_id",
    "vehicle_id",
    "driver_id",
    "firmware_version",
    "start_utc_us",
    "calibration",
    "streams",
)
FRAME_DTYPES = {"frame_idx": "int64", "device_ts_us": "int64"}
PEDAL_DTYPES = {"device_ts_us": "int64", "accel_raw": "int64", "brake_raw": "int64"}
IMU_DTYPES = {
    "device_ts_us": "int64",
    "ax": "float64",
    "ay": "float64",
    "az": "float64",
    "gx": "float64",
    "gy": "float64",
    "gz": "float64",
}
# utc_us는 부동소수 경유 없이 정수로 복원하려고 문자열로 읽는다.
GNSS_DTYPES = {
    "device_ts_us": "int64",
    "utc_us": "string",
    "lat": "float64",
    "lon": "float64",
    "speed_mps": "float64",
    "fix_quality": "int64",
}
MARKER_DTYPES = {"device_ts_us": "int64", "marker_type": "string", "stream": "string", "seq": "int64"}


def _read_json(archive: zipfile.ZipFile, member: str) -> dict:
    try:
        return json.loads(archive.read(member))
    except KeyError as error:
        raise IngestError(f"missing file in package: {member}") from error
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        raise IngestError(f"invalid JSON in {member}: {error}") from error


def _read_csv(archive: zipfile.ZipFile, member: str, dtypes: dict[str, str]) -> pd.DataFrame:
    try:
        with archive.open(member) as stream:
            header = pd.read_csv(stream, nrows=0)
        missing = set(dtypes) - set(header.columns)
        if missing:
            raise IngestError(f"{member} is missing columns: {sorted(missing)}")
        with archive.open(member) as stream:
            return pd.read_csv(stream, usecols=list(dtypes), dtype=dtypes)
    except KeyError as error:
        raise IngestError(f"missing file in package: {member}") from error
    except ValueError as error:
        raise IngestError(f"cannot parse {member}: {error}") from error
    except pd.errors.ParserError as error:
        raise IngestError(f"cannot parse {member}: {error}") from error
    except pd.errors.EmptyDataError as error:
        raise IngestError(f"{member} is empty") from error


def _ints(frame: pd.DataFrame, column: str) -> np.ndarray:
    return frame[column].to_numpy(dtype=np.int64)


def _floats(frame: pd.DataFrame, column: str) -> np.ndarray:
    return frame[column].to_numpy(dtype=np.float64)


def _strings(frame: pd.DataFrame, column: str) -> np.ndarray:
    return frame[column].to_numpy(dtype=str)


def _parse_manifest(raw: dict) -> Manifest:
    missing = [key for key in MANIFEST_KEYS if key not in raw]
    if missing:
        raise IngestError(f"manifest is missing keys: {missing}")
    if not isinstance(raw["start_utc_us"], int) or isinstance(raw["start_utc_us"], bool):
        raise IngestError("manifest start_utc_us must be an integer")
    for pedal in ("accel", "brake"):
        calibration = raw["calibration"].get(pedal, {})
        if "zero_raw" not in calibration or "full_scale_raw" not in calibration:
            raise IngestError(f"manifest calibration is missing zero_raw/full_scale_raw for {pedal}")
        if calibration["full_scale_raw"] <= calibration["zero_raw"]:
            raise IngestError(f"manifest calibration for {pedal} has full_scale_raw <= zero_raw")
    return Manifest(**{key: raw[key] for key in MANIFEST_KEYS})


def _check_timestamps(name: str, timestamps: np.ndarray, issues: list[IngestIssue]) -> None:
    if timestamps.size == 0:
        issues.append(IngestIssue("empty_stream", f"{name} has no rows"))
    elif timestamps.size > 1 and np.any(np.diff(timestamps) <= 0):
        issues.append(IngestIssue("non_monotonic_timestamps", f"{name} timestamps are not strictly increasing"))


def _check_gaps(name: str, timestamps: np.ndarray, nominal_hz: float, issues: list[IngestIssue]) -> None:
    stats = gap_stats(timestamps, nominal_hz)
    if stats.missing:
        issues.append(
            IngestIssue(
                "samples_missing",
                f"{name}: about {stats.missing} of {stats.expected} samples missing, "
                f"largest gap {stats.largest_gap_us} us",
            )
        )


def _parse_video(archive: zipfile.ZipFile, manifest: Manifest, name: str, issues: list[IngestIssue]) -> VideoStream:
    entry = manifest.stream(name)
    member = entry.get("file")
    frames_member = entry.get("frames_file")
    if not member or not frames_member:
        raise IngestError(f"manifest stream {name} needs file and frames_file")
    if member not in archive.namelist():
        raise IngestError(f"missing file in package: {member}")
    frames = _read_csv(archive, frames_member, FRAME_DTYPES)
    frame_idx = _ints(frames, "frame_idx")
    timestamps = _ints(frames, "device_ts_us")
    if not np.array_equal(frame_idx, np.arange(frame_idx.size)):
        issues.append(IngestIssue("frame_idx_not_contiguous", f"{frames_member} frame_idx must be 0..N-1"))
    _check_timestamps(name, timestamps, issues)
    _check_gaps(name, timestamps, entry["nominal_fps"], issues)
    return VideoStream(name, member, float(entry["nominal_fps"]), frame_idx, timestamps)


def _parse_pedal(archive: zipfile.ZipFile, manifest: Manifest, issues: list[IngestIssue]) -> PedalData:
    entry = manifest.stream("pedal")
    table = _read_csv(archive, "pedal.csv", PEDAL_DTYPES)
    data = PedalData(_ints(table, "device_ts_us"), _ints(table, "accel_raw"), _ints(table, "brake_raw"))
    _check_timestamps("pedal", data.device_ts_us, issues)
    _check_gaps("pedal", data.device_ts_us, entry["nominal_hz"], issues)
    adc_max = 2 ** int(entry.get("adc_bits", 12)) - 1
    for name, values in (("accel_raw", data.accel_raw), ("brake_raw", data.brake_raw)):
        if values.size and (values.min() < 0 or values.max() > adc_max):
            issues.append(IngestIssue("adc_out_of_range", f"pedal.csv {name} is outside 0..{adc_max}"))
    return data


def _parse_imu(archive: zipfile.ZipFile, manifest: Manifest, issues: list[IngestIssue]) -> ImuData:
    table = _read_csv(archive, "imu.csv", IMU_DTYPES)
    data = ImuData(_ints(table, "device_ts_us"), *(_floats(table, axis) for axis in ("ax", "ay", "az", "gx", "gy", "gz")))
    _check_timestamps("imu", data.device_ts_us, issues)
    _check_gaps("imu", data.device_ts_us, manifest.stream("imu")["nominal_hz"], issues)
    return data


def _parse_gnss(archive: zipfile.ZipFile, manifest: Manifest, issues: list[IngestIssue]) -> GnssData:
    table = _read_csv(archive, "gnss.csv", GNSS_DTYPES)
    utc = np.full(len(table), UTC_MISSING, dtype=np.int64)
    present = table["utc_us"].notna().to_numpy()
    try:
        utc[present] = [int(value) for value in table["utc_us"][present]]
    except ValueError as error:
        raise IngestError(f"cannot parse gnss.csv utc_us: {error}") from error
    data = GnssData(
        _ints(table, "device_ts_us"),
        utc,
        _floats(table, "lat"),
        _floats(table, "lon"),
        _floats(table, "speed_mps"),
        _ints(table, "fix_quality"),
    )
    _check_timestamps("gnss", data.device_ts_us, issues)
    _check_gaps("gnss", data.device_ts_us, manifest.stream("gnss")["nominal_hz"], issues)
    if not present.all():
        issues.append(IngestIssue("gnss_no_fix", f"gnss.csv has {int((~present).sum())} rows without a fix"))
    return data


def _parse_markers(archive: zipfile.ZipFile, issues: list[IngestIssue]) -> SyncMarkers:
    table = _read_csv(archive, "sync_markers.csv", MARKER_DTYPES)
    markers = SyncMarkers(
        _ints(table, "device_ts_us"), _strings(table, "marker_type"), _strings(table, "stream"), _ints(table, "seq")
    )
    for required in ("pps", "led_flash", "brake_tap"):
        if not markers.select(required).any():
            issues.append(IngestIssue("sync_marker_missing", f"sync_markers.csv has no {required} markers"))
    return markers


class IngestV1Adapter:
    format_id = FORMAT_ID

    def can_read(self, archive: zipfile.ZipFile) -> bool:
        if MANIFEST_MEMBER not in archive.namelist():
            return False
        try:
            return json.loads(archive.read(MANIFEST_MEMBER)).get("format") == FORMAT_ID
        except (json.JSONDecodeError, UnicodeDecodeError, AttributeError):
            return False

    def parse(self, archive: zipfile.ZipFile, source: Path) -> ParsedSession:
        manifest = _parse_manifest(_read_json(archive, MANIFEST_MEMBER))
        issues: list[IngestIssue] = []
        return ParsedSession(
            source=source,
            manifest=manifest,
            front=_parse_video(archive, manifest, "front", issues),
            foot=_parse_video(archive, manifest, "foot", issues),
            pedal=_parse_pedal(archive, manifest, issues),
            imu=_parse_imu(archive, manifest, issues),
            gnss=_parse_gnss(archive, manifest, issues),
            sync_markers=_parse_markers(archive, issues),
            issues=issues,
        )


register_adapter(IngestV1Adapter())
