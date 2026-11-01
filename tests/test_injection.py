"""결함 주입이 정답과 파싱 결과에 올바르게 드러나는지 확인한다."""

import numpy as np

from psi_synth import Injection, SynthParams, simulate_session


def fast(**injection):
    return simulate_session(SynthParams("pedestrian", seed=9, n_events=1, injection=Injection(**injection)))


def markers(session, marker_type, stream=None):
    table = session.tables["sync_markers"]
    table = table[table["marker_type"] == marker_type]
    return table if stream is None else table[table["stream"] == stream]


def test_default_session_has_all_sync_markers_per_clock():
    session = fast()
    for stream in ("front", "foot", "pedal", "motion"):
        assert len(markers(session, "pps", stream)) >= 1
    assert len(markers(session, "led_flash", "front")) == 1
    assert len(markers(session, "led_flash", "foot")) == 1
    assert len(markers(session, "brake_tap", "pedal")) == 1
    assert len(markers(session, "stationary", "motion")) == 1


def test_pps_markers_recover_each_injected_clock():
    """같은 seq의 PPS를 선형 회귀하면 주입한 드리프트가 나와야 한다(Phase 2 입력 조건)."""
    session = simulate_session(SynthParams("pedestrian", seed=3, n_events=4, injection=Injection(pps_jitter_us=0.0)))
    first = session.start_utc_us // 1_000_000 + 1
    for name, clock in session.clocks.items():
        rows = markers(session, "pps", name)
        utc = (first + rows["seq"].to_numpy()) * 1_000_000
        slope, _ = np.polyfit(rows["device_ts_us"].to_numpy(), utc - utc[0], 1)
        assert abs((slope - 1.0) * 1e6 - clock.drift_ppm) < 0.1


def test_led_marker_is_a_real_frame_timestamp_after_the_flash():
    session = fast()
    gesture = session.truth["sync_gesture"]
    assert gesture["flash_us"] - gesture["tap_us"] == session.manifest["calibration"]["sync"]["led_after_tap_us"]
    for stream in ("front", "foot"):
        marker = int(markers(session, "led_flash", stream)["device_ts_us"].iloc[0])
        assert marker in set(session.tables[f"{stream}_frames"]["device_ts_us"].tolist())
        master = int(session.clocks[stream].to_master(np.array([marker]))[0])
        assert 0 <= master - gesture["flash_us"] <= 34_000


def test_omit_markers_removes_only_requested_rows():
    session = fast(omit_markers=("led_flash", "pps"))
    assert markers(session, "led_flash").empty
    assert markers(session, "pps").empty
    assert len(markers(session, "brake_tap")) == 1
    assert session.truth["sync_gesture"] is not None


def test_no_sync_gesture_removes_the_physical_tap_and_flash():
    session = fast(no_sync_gesture=True)
    assert session.truth["sync_gesture"] is None
    assert markers(session, "led_flash").empty
    assert markers(session, "brake_tap").empty
    assert session.drive.flash_ms is None
    assert session.drive.brake_pct[: session.drive.sync_end_ms].max() == 0.0


def test_gnss_outage_blanks_fix_and_stops_pps():
    session = fast(gnss_outage_s=(10.0, 4.0))
    gnss = session.tables["gnss"]
    no_fix = gnss[gnss["fix_quality"] == 0]
    assert len(no_fix) == 40
    assert no_fix["utc_us"].isna().all() and no_fix["speed_mps"].isna().all()
    assert gnss[gnss["fix_quality"] == 1]["utc_us"].notna().all()

    outage = session.truth["gnss_outage"]
    pps = markers(session, "pps", "motion")
    master = session.clocks["motion"].to_master(pps["device_ts_us"].to_numpy())
    assert not ((master >= outage["start_us"]) & (master < outage["end_us"])).any()
    assert np.diff(pps["seq"].to_numpy()).max() >= 4


def test_sensor_gaps_remove_samples_in_recorded_windows():
    session = fast(sensor_gap_count=3)
    for stream, clock_name in (("pedal", "pedal"), ("imu", "motion")):
        gaps = session.truth["sensor_gaps"][stream]
        assert len(gaps) == 3
        master = session.clocks[clock_name].to_master(session.tables[stream]["device_ts_us"].to_numpy())
        for gap in gaps:
            # 클록 왕복 오차 1µs 여유를 둔다.
            inside = (master >= gap["start_us"] + 1) & (master < gap["end_us"] - 1)
            assert not inside.any()


def test_zero_bias_shifts_raw_values():
    clean = fast(pedal_noise_counts=0.0)
    biased = fast(pedal_noise_counts=0.0, pedal_zero_bias_counts=40)
    diff = biased.tables["pedal"]["accel_raw"].to_numpy() - clean.tables["pedal"]["accel_raw"].to_numpy()
    assert np.median(diff) == 40


def test_frame_drop_rate_is_near_requested_and_spares_flash_frames():
    session = fast(frame_drop_rate=0.02)
    for stream in ("front", "foot"):
        assert 0.005 < session.truth["frames"][stream]["drop_rate"] < 0.05
    assert len(markers(session, "led_flash")) == 2


def test_foot_camera_can_run_at_60fps():
    session = simulate_session(SynthParams("normal", seed=1, n_events=1, foot_fps=60.0))
    median = np.median(np.diff(session.tables["foot_frames"]["device_ts_us"].to_numpy()))
    assert abs(median - 1e6 / 60) < 5
    assert session.manifest["streams"][1]["nominal_fps"] == 60.0
