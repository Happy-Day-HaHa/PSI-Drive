"""시뮬레이션 결과에 클록 오차와 센서 결함을 입혀 Ingest Format v1 테이블과 정답을 만든다."""

import math
from dataclasses import asdict, dataclass, replace

import numpy as np
import pandas as pd

from psi_synth.clocks import ClockModel, draw_clocks
from psi_synth.driving import LED_AFTER_TAP_MS, LED_DURATION_MS, DriveScript, HazardEvent, build_drive
from psi_synth.params import CLOCK_NAMES, SCENARIOS, SynthParams
from psi_synth.truth import G_MPS2, TruthThresholds, count_rising_edges, intersect, load_thresholds, on_intervals

GENERATOR_VERSION = "0.1.0"
INGEST_FORMAT = "psi-ingest-v1"
BASE_START_UTC_US = 1_780_272_000_000_000  # 2026-06-01T00:00:00Z
START_SPREAD_US = 30 * 86_400_000_000
ADC_MAX = 4095
ORIGIN_LAT = 37.5665
ORIGIN_LON = 126.9780
EARTH_RADIUS_M = 6_371_000.0
VIDEO_SIZES = {"front": (1920, 1080), "foot": (1280, 720)}


@dataclass
class SyntheticSession:
    params: SynthParams
    manifest: dict
    tables: dict[str, pd.DataFrame]
    truth: dict
    drive: DriveScript
    clocks: dict[str, ClockModel]
    frame_rel_us: dict[str, np.ndarray]
    start_utc_us: int


def _frame_times(
    fps: float, duration_us: int, flash_ms: int | None, jitter_us: float, drop_rate: float, rng: np.random.Generator
) -> tuple[np.ndarray, int]:
    period = 1e6 / fps
    count = int(duration_us / period)
    k = np.arange(count)
    rel = np.rint(rng.uniform(0, period) + k * period + rng.normal(0, jitter_us, count)).astype(np.int64)
    in_range = (rel >= 0) & (rel < duration_us)
    rel = rel[in_range]
    dropped = rng.random(rel.size) < drop_rate
    if flash_ms is not None:
        # 플래시가 찍힌 프레임은 동기화 마커의 근거이므로 드롭 대상에서 뺀다.
        dropped &= ~((rel >= flash_ms * 1000) & (rel < (flash_ms + LED_DURATION_MS) * 1000))
    return rel[~dropped], int(dropped.sum())


def _sample_times(hz: int, duration_us: int, jitter_us: float, rng: np.random.Generator) -> np.ndarray:
    period = 1e6 / hz
    count = int(duration_us / period)
    rel = np.rint(np.arange(count) * period + rng.normal(0, jitter_us, count)).astype(np.int64)
    return rel[(rel >= 0) & (rel < duration_us)]


def _draw_gaps(params: SynthParams, drive: DriveScript, stream: str, rng: np.random.Generator) -> list[tuple[int, int]]:
    injection = params.injection
    gaps = []
    for _ in range(injection.sensor_gap_count):
        length = int(rng.integers(injection.sensor_gap_ms[0], injection.sensor_gap_ms[1] + 1))
        start = int(rng.integers(drive.sync_end_ms, drive.duration_ms - length))
        gaps.append((start * 1000, (start + length) * 1000))
    return sorted(gaps)


def _outside_gaps(rel_us: np.ndarray, gaps: list[tuple[int, int]]) -> np.ndarray:
    keep = np.ones(rel_us.size, dtype=bool)
    for start, end in gaps:
        keep &= ~((rel_us >= start) & (rel_us < end))
    return keep


def _interp_ms(rel_us: np.ndarray, signal: np.ndarray) -> np.ndarray:
    return np.interp(rel_us / 1000.0, np.arange(signal.size), signal)


def _pedal_table(params, drive, clock, gaps, calibration, rng) -> pd.DataFrame:
    injection = params.injection
    rel = _sample_times(params.pedal_hz, drive.duration_ms * 1000, injection.sample_jitter_us, rng)
    keep = _outside_gaps(rel, gaps)
    rel = rel[keep]

    def to_raw(signal: np.ndarray, cal: dict) -> np.ndarray:
        span = cal["full_scale_raw"] - cal["zero_raw"]
        ideal = cal["zero_raw"] + injection.pedal_zero_bias_counts + _interp_ms(rel, signal) / 100.0 * span
        noisy = ideal + rng.normal(0, injection.pedal_noise_counts, rel.size)
        return np.clip(np.rint(noisy), 0, ADC_MAX).astype(np.int64)

    return pd.DataFrame(
        {
            "device_ts_us": clock.to_device(rel),
            "accel_raw": to_raw(drive.accel_pct, calibration["accel"]),
            "brake_raw": to_raw(drive.brake_pct, calibration["brake"]),
        }
    )


def _imu_table(params, drive, clock, gaps, rng) -> pd.DataFrame:
    injection = params.injection
    rel = _sample_times(params.imu_hz, drive.duration_ms * 1000, injection.sample_jitter_us, rng)
    rel = rel[_outside_gaps(rel, gaps)]
    sigma = injection.imu_noise_mps2
    gyro_sigma = sigma * 0.02
    n = rel.size
    return pd.DataFrame(
        {
            "device_ts_us": clock.to_device(rel),
            "ax": np.round(_interp_ms(rel, drive.accel_mps2) + rng.normal(0, sigma, n), 5),
            "ay": np.round(rng.normal(0, sigma, n), 5),
            "az": np.round(G_MPS2 + rng.normal(0, sigma, n), 5),
            "gx": np.round(rng.normal(0, gyro_sigma, n), 6),
            "gy": np.round(rng.normal(0, gyro_sigma, n), 6),
            "gz": np.round(rng.normal(0, gyro_sigma, n), 6),
        }
    )


def _gnss_table(params, drive, clock, gaps, outage_us, start_utc_us, rng) -> pd.DataFrame:
    injection = params.injection
    period = int(1_000_000 / params.gnss_hz)
    rel = np.arange(0, drive.duration_ms * 1000, period, dtype=np.int64)
    rel = rel[_outside_gaps(rel, gaps)]
    n = rel.size
    fix = np.ones(n, dtype=bool)
    if outage_us is not None:
        fix = ~((rel >= outage_us[0]) & (rel < outage_us[1]))
    distance = _interp_ms(rel, drive.distance_m)
    # 지구 곡률 영향이 무시되는 짧은 직선 주행으로, 위도 고정·경도 증가 방향으로 달린다.
    lon_deg = ORIGIN_LON + np.degrees(distance / (EARTH_RADIUS_M * math.cos(math.radians(ORIGIN_LAT))))
    speed = np.maximum(_interp_ms(rel, drive.speed_mps) + rng.normal(0, injection.gnss_speed_noise_mps, n), 0.0)
    utc = start_utc_us + rel + np.rint(rng.normal(0, 20.0, n)).astype(np.int64)
    return pd.DataFrame(
        {
            "device_ts_us": clock.to_device(rel),
            "utc_us": pd.Series(utc, dtype="Int64").where(fix),
            "lat": pd.Series(np.round(np.full(n, ORIGIN_LAT), 7)).where(fix),
            "lon": pd.Series(np.round(lon_deg, 7)).where(fix),
            "speed_mps": pd.Series(np.round(speed, 3)).where(fix),
            "fix_quality": fix.astype(np.int64),
        }
    )


def _pps_rows(clocks, start_utc_us, duration_us, outage_us, jitter_us, rng) -> list[dict]:
    first = math.ceil(start_utc_us / 1_000_000) * 1_000_000
    pulses = np.arange(first, start_utc_us + duration_us, 1_000_000, dtype=np.int64)
    rows = []
    for name in CLOCK_NAMES:
        jitter = np.rint(rng.normal(0, jitter_us, pulses.size)).astype(np.int64)
        device = clocks[name].to_device(pulses + jitter)
        for seq, (pulse, ts) in enumerate(zip(pulses.tolist(), device.tolist())):
            rel = pulse - start_utc_us
            if outage_us is not None and outage_us[0] <= rel < outage_us[1]:
                continue
            rows.append({"device_ts_us": ts, "marker_type": "pps", "stream": name, "seq": seq})
    return rows


def _marker_table(params, drive, clocks, start_utc_us, frame_rel, outage_us, rng) -> pd.DataFrame:
    injection = params.injection
    rows = _pps_rows(clocks, start_utc_us, drive.duration_ms * 1000, outage_us, injection.pps_jitter_us, rng)
    if drive.tap_ms is not None:
        tap_master = start_utc_us + drive.tap_ms * 1000
        rows.append(
            {
                "device_ts_us": int(clocks["pedal"].to_device(np.array([tap_master]))[0]),
                "marker_type": "brake_tap",
                "stream": "pedal",
                "seq": 0,
            }
        )
        still_master = start_utc_us + drive.stationary_ms * 1000
        rows.append(
            {
                "device_ts_us": int(clocks["motion"].to_device(np.array([still_master]))[0]),
                "marker_type": "stationary",
                "stream": "motion",
                "seq": 0,
            }
        )
        flash_us = drive.flash_ms * 1000
        for name in ("front", "foot"):
            rel = frame_rel[name]
            first = rel[rel >= flash_us][0]
            rows.append(
                {
                    "device_ts_us": int(clocks[name].to_device(np.array([start_utc_us + first]))[0]),
                    "marker_type": "led_flash",
                    "stream": name,
                    "seq": 0,
                }
            )
    table = pd.DataFrame(rows, columns=["device_ts_us", "marker_type", "stream", "seq"])
    table = table[~table["marker_type"].isin(injection.omit_markers)]
    return table.sort_values(["stream", "device_ts_us"], kind="stable").reset_index(drop=True)


def _event_truth(index: int, event: HazardEvent, start_utc_us: int) -> dict:
    to_master = lambda ms: start_utc_us + ms * 1000  # noqa: E731
    return {
        "index": index,
        "type": event.event_type,
        "T0_us": to_master(event.t0),
        "T1_us": to_master(event.t1),
        "T2_us": to_master(event.t2),
        "T3_us": to_master(event.t3),
        "T4_us": to_master(event.t4),
        "T5_us": to_master(event.t5),
        "T6_us": to_master(event.t6),
        "T7_us": to_master(event.t7),
        "metrics": {
            "recognition_to_release_us": (event.t1 - event.t0) * 1000,
            "pedal_transition_us": (event.t4 - event.t2) * 1000,
            "total_brake_reaction_us": (event.t4 - event.t0) * 1000,
            "brake_rise_us": (event.t5 - event.t4) * 1000,
            "vehicle_response_delay_us": (event.t6 - event.t4) * 1000,
        },
    }


def _habit_truth(drive: DriveScript, th: TruthThresholds, accel_on, brake_on, overlaps) -> dict:
    distance_km = float(drive.distance_m[-1]) / 1000.0
    hard_brakes = count_rising_edges(drive.accel_mps2 <= th.hard_brake_g * G_MPS2)
    hard_accels = count_rising_edges(drive.accel_mps2 >= th.hard_accel_g * G_MPS2)
    any_pedal = np.zeros(drive.duration_ms, dtype=bool)
    for start, end in accel_on + brake_on:
        any_pedal[start:end] = True
    moving = drive.speed_mps > 0.0
    moving_ms = int(moving.sum())
    per_100km = lambda count: count / distance_km * 100.0 if distance_km > 0 else None  # noqa: E731
    return {
        "distance_km": distance_km,
        "hard_brake_count": hard_brakes,
        "hard_brake_per_100km": per_100km(hard_brakes),
        "hard_accel_count": hard_accels,
        "hard_accel_per_100km": per_100km(hard_accels),
        "coast_ratio": int((moving & ~any_pedal).sum()) / moving_ms if moving_ms else 0.0,
        "overlap_count": len(overlaps),
        "overlap_total_us": sum(end - start for start, end in overlaps) * 1000,
    }


def simulate_session(params: SynthParams, thresholds: TruthThresholds | None = None) -> SyntheticSession:
    """영상 렌더링 없이 세션 전체를 메모리에 만든다. 같은 입력이면 항상 같은 결과를 낸다."""
    th = thresholds or load_thresholds()
    injection = params.injection
    seed = np.random.SeedSequence([params.seed, SCENARIOS.index(params.scenario)])
    drive_rng, clock_rng, sensor_rng, frame_rng, marker_rng, meta_rng = [
        np.random.default_rng(s) for s in seed.spawn(6)
    ]

    drive = build_drive(
        params.scenario,
        params.n_events,
        params.overlap_count,
        params.harsh_accel_count,
        params.min_duration_s,
        injection.no_sync_gesture,
        drive_rng,
        th,
    )
    duration_us = drive.duration_ms * 1000
    start_utc_us = BASE_START_UTC_US + int(meta_rng.integers(0, START_SPREAD_US))
    clocks = draw_clocks(clock_rng, injection, start_utc_us)

    outage_us = None
    if injection.gnss_outage_s is not None:
        begin = int(injection.gnss_outage_s[0] * 1e6)
        outage_us = (begin, begin + int(injection.gnss_outage_s[1] * 1e6))

    frame_rel: dict[str, np.ndarray] = {}
    frame_truth: dict[str, dict] = {}
    tables: dict[str, pd.DataFrame] = {}
    for name, fps in (("front", params.front_fps), ("foot", params.foot_fps)):
        rel, dropped = _frame_times(
            fps, duration_us, drive.flash_ms, injection.frame_jitter_us, injection.frame_drop_rate, frame_rng
        )
        frame_rel[name] = rel
        captured = rel.size + dropped
        frame_truth[name] = {"captured": captured, "dropped": dropped, "drop_rate": dropped / captured}
        tables[f"{name}_frames"] = pd.DataFrame(
            {"frame_idx": np.arange(rel.size, dtype=np.int64), "device_ts_us": clocks[name].to_device(start_utc_us + rel)}
        )

    calibration = {
        "accel": {
            "zero_raw": int(meta_rng.integers(120, 240)),
            "full_scale_raw": int(meta_rng.integers(3500, 3900)),
        },
        "brake": {
            "zero_raw": int(meta_rng.integers(120, 240)),
            "full_scale_raw": int(meta_rng.integers(3500, 3900)),
        },
        "imu": {"forward_axis": "ax", "units": {"accel": "m/s^2", "gyro": "rad/s"}},
        "sync": {"led_after_tap_us": LED_AFTER_TAP_MS * 1000},
    }
    gaps = {name: _draw_gaps(params, drive, name, sensor_rng) for name in ("pedal", "imu", "gnss")}
    tables["pedal"] = _pedal_table(
        params, drive, _with_master(clocks["pedal"], start_utc_us), gaps["pedal"], calibration, sensor_rng
    )
    motion = _with_master(clocks["motion"], start_utc_us)
    tables["imu"] = _imu_table(params, drive, motion, gaps["imu"], sensor_rng)
    tables["gnss"] = _gnss_table(params, drive, motion, gaps["gnss"], outage_us, start_utc_us, sensor_rng)
    tables["sync_markers"] = _marker_table(params, drive, clocks, start_utc_us, frame_rel, outage_us, marker_rng)

    device_id = "PSI-KIT-0001"
    session_id = f"synth-{params.scenario}-{params.seed}"
    manifest = {
        "format": INGEST_FORMAT,
        "session_id": session_id,
        "device_id": device_id,
        "vehicle_id": "VEH-SYNTH-01",
        "driver_id": f"DRV-{params.seed:04d}",
        "firmware_version": f"synth-{GENERATOR_VERSION}",
        "start_utc_us": start_utc_us,
        "calibration": calibration,
        "streams": [
            _video_stream("front", params.front_fps),
            _video_stream("foot", params.foot_fps),
            {"name": "pedal", "kind": "pedal", "file": "pedal.csv", "clock": "pedal", "nominal_hz": params.pedal_hz, "adc_bits": 12},
            {"name": "imu", "kind": "imu", "file": "imu.csv", "clock": "motion", "nominal_hz": params.imu_hz},
            {"name": "gnss", "kind": "gnss", "file": "gnss.csv", "clock": "motion", "nominal_hz": params.gnss_hz},
        ],
    }

    accel_on = on_intervals(drive.accel_pct, th.on_pct, th.off_pct, th.debounce_ms)
    brake_on = on_intervals(drive.brake_pct, th.on_pct, th.off_pct, th.debounce_ms)
    overlaps = intersect(accel_on, brake_on)
    to_master = lambda spans: [  # noqa: E731
        {"start_us": start_utc_us + start * 1000, "end_us": start_utc_us + end * 1000} for start, end in spans
    ]
    truth = {
        "schema": "psi-synth-truth-v1",
        "generator_version": GENERATOR_VERSION,
        "config_version": th.config_version,
        "session_id": session_id,
        "scenario": params.scenario,
        "seed": params.seed,
        "start_utc_us": start_utc_us,
        "duration_us": duration_us,
        "clocks": {name: asdict(clock) for name, clock in clocks.items()},
        "events": [_event_truth(i, event, start_utc_us) for i, event in enumerate(drive.events)],
        "accel_on": to_master(accel_on),
        "brake_on": to_master(brake_on),
        "overlaps": to_master(overlaps),
        "habit_metrics": _habit_truth(drive, th, accel_on, brake_on, overlaps),
        "sync_gesture": _gesture_truth(drive, start_utc_us),
        "vehicle": asdict(drive.vehicle),
        "frames": frame_truth,
        "sensor_gaps": {
            name: [{"start_us": start_utc_us + a, "end_us": start_utc_us + b} for a, b in spans]
            for name, spans in gaps.items()
        },
        "gnss_outage": None
        if outage_us is None
        else {"start_us": start_utc_us + outage_us[0], "end_us": start_utc_us + outage_us[1]},
        "injection": {
            "pedal_zero_bias_counts": injection.pedal_zero_bias_counts,
            "frame_drop_rate": injection.frame_drop_rate,
            "sensor_gap_count": injection.sensor_gap_count,
            "omit_markers": list(injection.omit_markers),
            "no_sync_gesture": injection.no_sync_gesture,
        },
        "rows": {name: len(table) for name, table in tables.items()},
    }
    return SyntheticSession(params, manifest, tables, truth, drive, clocks, frame_rel, start_utc_us)


def _with_master(clock: ClockModel, start_utc_us: int) -> ClockModel:
    """세션 상대 시각을 받는 테이블 함수용으로 오프셋을 세션 시작 기준으로 옮긴다."""
    return replace(clock, offset_us=clock.offset_us - start_utc_us)


def _video_stream(name: str, fps: float) -> dict:
    width, height = VIDEO_SIZES[name]
    return {
        "name": name,
        "kind": "video",
        "file": f"{name}.mp4",
        "frames_file": f"{name}_frames.csv",
        "clock": name,
        "nominal_fps": fps,
        "width": width,
        "height": height,
        "codec": "h264",
    }


def _gesture_truth(drive: DriveScript, start_utc_us: int) -> dict | None:
    if drive.tap_ms is None:
        return None
    return {
        "stationary_us": start_utc_us + drive.stationary_ms * 1000,
        "tap_us": start_utc_us + drive.tap_ms * 1000,
        "flash_us": start_utc_us + drive.flash_ms * 1000,
        "flash_duration_us": LED_DURATION_MS * 1000,
    }
