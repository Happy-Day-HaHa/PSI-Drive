"""파싱 결과 모델. 타임스탬프 배열은 모두 int64 µs다."""

from dataclasses import dataclass, field
from pathlib import Path

import numpy as np

UTC_MISSING = -1


class IngestError(Exception):
    """세션을 해석할 수 없는 치명적 오류."""


@dataclass(frozen=True)
class IngestIssue:
    """처리는 계속할 수 있지만 품질 판정에 반영해야 하는 문제."""

    code: str
    message: str


@dataclass(frozen=True)
class Manifest:
    format: str
    session_id: str
    device_id: str
    vehicle_id: str
    driver_id: str
    firmware_version: str
    start_utc_us: int
    calibration: dict
    streams: list[dict]

    def stream(self, name: str) -> dict:
        for entry in self.streams:
            if entry.get("name") == name:
                return entry
        raise IngestError(f"manifest has no stream named {name!r}")


@dataclass(frozen=True)
class VideoStream:
    name: str
    member: str
    nominal_fps: float
    frame_idx: np.ndarray
    device_ts_us: np.ndarray


@dataclass(frozen=True)
class PedalData:
    device_ts_us: np.ndarray
    accel_raw: np.ndarray
    brake_raw: np.ndarray


@dataclass(frozen=True)
class ImuData:
    device_ts_us: np.ndarray
    ax: np.ndarray
    ay: np.ndarray
    az: np.ndarray
    gx: np.ndarray
    gy: np.ndarray
    gz: np.ndarray


@dataclass(frozen=True)
class GnssData:
    """fix가 없는 행은 utc_us가 UTC_MISSING이고 위치·속도는 NaN이다."""

    device_ts_us: np.ndarray
    utc_us: np.ndarray
    lat: np.ndarray
    lon: np.ndarray
    speed_mps: np.ndarray
    fix_quality: np.ndarray


@dataclass(frozen=True)
class SyncMarkers:
    device_ts_us: np.ndarray
    marker_type: np.ndarray
    stream: np.ndarray
    seq: np.ndarray

    def select(self, marker_type: str, stream: str | None = None) -> np.ndarray:
        """해당 마커 행의 불리언 마스크."""
        mask = self.marker_type == marker_type
        if stream is not None:
            mask &= self.stream == stream
        return mask


@dataclass
class ParsedSession:
    source: Path
    manifest: Manifest
    front: VideoStream
    foot: VideoStream
    pedal: PedalData
    imu: ImuData
    gnss: GnssData
    sync_markers: SyncMarkers
    issues: list[IngestIssue] = field(default_factory=list)

    def issue_codes(self) -> set[str]:
        return {issue.code for issue in self.issues}
