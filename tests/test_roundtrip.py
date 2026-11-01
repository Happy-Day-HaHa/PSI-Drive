"""Phase 1 완료 기준: 생성기 → 파서 왕복과 정답 JSON 동시 출력."""

import json
import zipfile

import imageio_ffmpeg
import numpy as np
import pytest

from psi_signal.ingest import gap_stats, parse_session, verify_video_frames
from psi_signal.ingest.models import UTC_MISSING
from psi_synth.render import led_box, scaled_size

from conftest import VIDEO_SCALE


def test_package_has_spec_layout_and_truth_stays_outside(packaged):
    _, zip_path, truth_path = packaged
    assert zip_path.name.startswith("session_PSI-KIT-0001_")
    assert truth_path.name == zip_path.name.replace(".zip", ".truth.json")
    with zipfile.ZipFile(zip_path) as archive:
        assert sorted(archive.namelist()) == sorted(
            [
                "manifest.json",
                "front.mp4",
                "front_frames.csv",
                "foot.mp4",
                "foot_frames.csv",
                "pedal.csv",
                "imu.csv",
                "gnss.csv",
                "sync_markers.csv",
            ]
        )


def test_truth_json_matches_session(packaged):
    session, _, truth_path = packaged
    assert json.loads(truth_path.read_text(encoding="utf-8")) == session.truth
    assert session.truth["config_version"] == "v1"


def test_manifest_round_trip(packaged):
    session, zip_path, _ = packaged
    manifest = parse_session(zip_path).manifest
    assert manifest.format == "psi-ingest-v1"
    assert manifest.start_utc_us == session.start_utc_us
    assert manifest.driver_id == session.manifest["driver_id"]
    assert manifest.calibration == session.manifest["calibration"]
    assert manifest.streams == session.manifest["streams"]


def test_tables_round_trip_exactly(packaged):
    session, zip_path, _ = packaged
    parsed = parse_session(zip_path)
    tables = session.tables

    for name, stream in (("front", parsed.front), ("foot", parsed.foot)):
        assert stream.device_ts_us.dtype == np.int64
        np.testing.assert_array_equal(stream.device_ts_us, tables[f"{name}_frames"]["device_ts_us"])
        np.testing.assert_array_equal(stream.frame_idx, tables[f"{name}_frames"]["frame_idx"])

    assert parsed.pedal.device_ts_us.dtype == np.int64
    for column in ("device_ts_us", "accel_raw", "brake_raw"):
        np.testing.assert_array_equal(getattr(parsed.pedal, column), tables["pedal"][column])

    for column in ("device_ts_us", "ax", "ay", "az", "gx", "gy", "gz"):
        np.testing.assert_array_equal(getattr(parsed.imu, column), tables["imu"][column])

    np.testing.assert_array_equal(parsed.gnss.utc_us, tables["gnss"]["utc_us"].astype("int64"))
    np.testing.assert_array_equal(parsed.gnss.speed_mps, tables["gnss"]["speed_mps"])
    np.testing.assert_array_equal(parsed.gnss.lon, tables["gnss"]["lon"])

    np.testing.assert_array_equal(parsed.sync_markers.device_ts_us, tables["sync_markers"]["device_ts_us"])
    np.testing.assert_array_equal(parsed.sync_markers.marker_type, tables["sync_markers"]["marker_type"].to_numpy(dtype=str))
    np.testing.assert_array_equal(parsed.sync_markers.seq, tables["sync_markers"]["seq"])
    assert session.truth["rows"]["pedal"] == parsed.pedal.device_ts_us.size


def test_parsed_pedal_with_true_clock_reproduces_clean_signal(packaged):
    """파싱한 원시값에 정답 클록과 캘리브레이션을 적용하면 깨끗한 신호로 돌아와야 한다."""
    session, zip_path, _ = packaged
    parsed = parse_session(zip_path)
    rel_ms = (session.clocks["pedal"].to_master(parsed.pedal.device_ts_us) - session.start_utc_us) / 1000.0
    bias = session.params.injection.pedal_zero_bias_counts
    for raw, signal, name in (
        (parsed.pedal.accel_raw, session.drive.accel_pct, "accel"),
        (parsed.pedal.brake_raw, session.drive.brake_pct, "brake"),
    ):
        cal = parsed.manifest.calibration[name]
        pct = (raw - bias - cal["zero_raw"]) / (cal["full_scale_raw"] - cal["zero_raw"]) * 100.0
        clean = np.interp(rel_ms, np.arange(signal.size), signal)
        assert np.sqrt(np.mean((pct - clean) ** 2)) < 0.5


def test_parsed_imu_with_true_clock_shows_braking_at_truth_time(packaged):
    session, zip_path, _ = packaged
    parsed = parse_session(zip_path)
    master = session.clocks["motion"].to_master(parsed.imu.device_ts_us)
    event = session.truth["events"][0]
    window = (master >= event["T6_us"]) & (master < event["T6_us"] + 300_000)
    before = (master >= event["T0_us"] - 500_000) & (master < event["T0_us"])
    assert parsed.imu.ax[window].mean() < -0.98
    assert parsed.imu.ax[before].mean() > -0.98


def test_frame_counts_match_mp4(packaged):
    _, zip_path, _ = packaged
    parsed = parse_session(zip_path)
    counts = verify_video_frames(parsed)
    assert counts == {"front": parsed.front.frame_idx.size, "foot": parsed.foot.frame_idx.size}
    assert "video_frame_count_mismatch" not in parsed.issue_codes()


@pytest.mark.parametrize("stream", ["front", "foot"])
def test_led_flash_marker_matches_decoded_video(packaged, tmp_path, stream):
    session, zip_path, _ = packaged
    parsed = parse_session(zip_path)
    with zipfile.ZipFile(zip_path) as archive:
        video = tmp_path / f"{stream}.mp4"
        video.write_bytes(archive.read(f"{stream}.mp4"))
    width, height = scaled_size(stream, VIDEO_SCALE)
    x0, y0, x1, y1 = led_box(width, height)
    reader = imageio_ffmpeg.read_frames(str(video))
    meta = next(reader)
    assert tuple(meta["size"]) == (width, height)
    assert meta["codec"] == "h264"
    brightness = []
    for raw in reader:
        frame = np.frombuffer(raw, dtype=np.uint8).reshape(height, width, 3)
        brightness.append(frame[y0:y1, x0:x1].mean())
    lit = np.flatnonzero(np.array(brightness) > 128)
    markers = parsed.sync_markers
    marker_ts = markers.device_ts_us[markers.select("led_flash", stream)]
    frames = getattr(parsed, stream)
    expected = int(np.searchsorted(frames.device_ts_us, marker_ts[0]))
    # 저해상도 H.264는 키프레임 사이 번짐이 있어 ±1프레임까지 허용한다.
    assert abs(int(lit[0]) - expected) <= 1
    assert lit.size >= 4


def test_frame_drops_are_detected_from_timestamps(packaged):
    session, zip_path, _ = packaged
    parsed = parse_session(zip_path)
    for name, stream in (("front", parsed.front), ("foot", parsed.foot)):
        truth = session.truth["frames"][name]
        stats = gap_stats(stream.device_ts_us, stream.nominal_fps)
        assert truth["dropped"] > 0
        assert stats.missing == truth["dropped"]
        assert stats.expected == truth["captured"]
    assert "samples_missing" in parsed.issue_codes()


def test_gnss_times_are_exact_integers(packaged):
    session, zip_path, _ = packaged
    parsed = parse_session(zip_path)
    assert parsed.gnss.utc_us.dtype == np.int64
    assert (parsed.gnss.utc_us != UTC_MISSING).all()
    assert abs(int(parsed.gnss.utc_us[0]) - session.start_utc_us) < 200_000 + 1000
