"""시뮬레이션 정답의 내부 일관성과 재현성."""

import numpy as np
import pandas as pd
import pytest

from psi_synth import SCENARIOS, Injection, SynthParams, simulate_session
from psi_synth.clocks import ClockModel
from psi_synth.truth import G_MPS2, load_thresholds, on_intervals

SEEDS = range(12)


def fast(scenario, seed, **injection):
    return simulate_session(SynthParams(scenario, seed=seed, n_events=2, injection=Injection(**injection)))


@pytest.mark.parametrize("scenario", ["pedestrian", "lead_brake"])
@pytest.mark.parametrize("seed", SEEDS)
def test_hazard_events_follow_spec_order_and_thresholds(scenario, seed):
    session = fast(scenario, seed)
    th = load_thresholds()
    drive = session.drive
    assert len(session.truth["events"]) == 2
    for event in drive.events:
        assert event.t0 < event.t1 < event.t2 < event.t4 < event.t5 < event.t7
        assert event.t1 <= event.t3 <= event.t4
        assert event.t4 < event.t6 < event.t7
        assert drive.accel_pct[event.t1] > th.on_pct
        assert drive.accel_pct[event.t2] <= th.off_pct < drive.accel_pct[event.t2 - 1]
        assert drive.brake_pct[event.t4] == 0.0 and drive.brake_pct[event.t4 + 1] > 0.0
        assert drive.accel_mps2[event.t6] <= th.t6_decel_g * G_MPS2 < drive.accel_mps2[event.t6 - 1]
        if scenario == "pedestrian":
            assert drive.speed_mps[event.t7] == 0.0


def test_metrics_derive_from_event_times():
    event = fast("pedestrian", 3).truth["events"][0]
    metrics = event["metrics"]
    assert metrics["recognition_to_release_us"] == event["T1_us"] - event["T0_us"]
    assert metrics["pedal_transition_us"] == event["T4_us"] - event["T2_us"]
    assert metrics["total_brake_reaction_us"] == event["T4_us"] - event["T0_us"]
    assert metrics["brake_rise_us"] == event["T5_us"] - event["T4_us"]
    assert metrics["vehicle_response_delay_us"] == event["T6_us"] - event["T4_us"]


def test_normal_scenario_has_no_hazard_events_and_no_hard_braking():
    truth = fast("normal", 2).truth
    assert truth["events"] == []
    assert truth["habit_metrics"]["hard_brake_count"] == 0
    assert truth["habit_metrics"]["distance_km"] > 0
    assert 0 < truth["habit_metrics"]["coast_ratio"] < 1


@pytest.mark.parametrize("scenario", SCENARIOS)
def test_injected_overlaps_and_harsh_accels_are_counted(scenario):
    session = simulate_session(SynthParams(scenario, seed=5, n_events=1, overlap_count=3, harsh_accel_count=2))
    habits = session.truth["habit_metrics"]
    assert habits["overlap_count"] == len(session.truth["overlaps"]) == 3
    assert habits["overlap_total_us"] > 0
    assert habits["hard_accel_count"] == 2


def test_on_intervals_uses_onset_and_debounce():
    signal = np.zeros(1000)
    signal[100:200] = np.linspace(0, 50, 100)
    signal[200:300] = 50
    signal[300:400] = np.linspace(50, 0, 100)
    signal[600:610] = 50  # 디바운스보다 짧은 스파이크
    start, end = on_intervals(signal, 5.0, 2.0, 20)[0]
    assert start == 100
    assert 395 <= end <= 400
    assert len(on_intervals(signal, 5.0, 2.0, 20)) == 1


def test_same_seed_is_reproducible_and_seed_changes_output():
    a = fast("lead_brake", 11, frame_drop_rate=0.01, sensor_gap_count=1)
    b = fast("lead_brake", 11, frame_drop_rate=0.01, sensor_gap_count=1)
    c = fast("lead_brake", 12, frame_drop_rate=0.01, sensor_gap_count=1)
    assert a.truth == b.truth
    for name in a.tables:
        pd.testing.assert_frame_equal(a.tables[name], b.tables[name])
    assert a.truth["events"] != c.truth["events"]


def test_clock_model_matches_spec_formula_and_round_trips():
    clock = ClockModel(offset_us=1_780_000_000_000_000, drift_ppm=50.0, injected_offset_us=0)
    master = clock.offset_us + np.arange(0, 7_200_000_000, 7_919, dtype=np.int64)
    device = clock.to_device(master)
    assert device.dtype == np.int64
    expected = device * (1 + 50e-6) + clock.offset_us
    assert np.abs(expected - master).max() <= 2
    assert np.abs(clock.to_master(device) - master).max() <= 1


def test_clock_errors_stay_in_requested_range_and_overrides_apply():
    session = fast("normal", 4, max_offset_us=200_000, max_drift_ppm=30.0, clock_overrides={"pedal": (123_456, -7.5)})
    for name, clock in session.clocks.items():
        assert abs(clock.injected_offset_us) <= 200_000
        assert abs(clock.drift_ppm) <= 30.0
    assert session.clocks["pedal"].injected_offset_us == 123_456
    assert session.clocks["pedal"].drift_ppm == -7.5


def test_all_time_columns_are_int64_and_csv_has_no_decimal_timestamps():
    session = fast("pedestrian", 6, gnss_outage_s=(10.0, 3.0))
    for name, table in session.tables.items():
        assert table["device_ts_us"].dtype == np.int64, name
        first_column = table.to_csv(index=False).splitlines()[1].split(",")
        ts_position = list(table.columns).index("device_ts_us")
        assert "." not in first_column[ts_position], name
    assert session.tables["gnss"]["utc_us"].dtype == "Int64"


def test_scenario_validation():
    with pytest.raises(ValueError):
        SynthParams("drifting")
    with pytest.raises(ValueError):
        SynthParams("normal", injection=Injection(omit_markers=("gps",)))
