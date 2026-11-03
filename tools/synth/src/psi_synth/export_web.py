"""합성 세션의 깨끗한 신호로 웹 화면용 샘플 JSON을 만든다.

python -m psi_synth.export_web --out apps/web/src/lib/pedal-samples.json
"""

import argparse
import json
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import yaml

from psi_synth.params import SynthParams
from psi_synth.session import SyntheticSession, simulate_session
from psi_synth.truth import G_MPS2, TruthThresholds, find_default_config, load_thresholds, on_intervals

SAMPLE_DT_MS = 20
PADDING_MS = 1000
CURVE_STEP_MS = 25
CURVE_LENGTH_MS = 1500
SYNC_BRAKE_TAP_LIMIT_MS = 1000
HAZARDS_PER_SESSION = 2
WEEKDAYS = "월화수목금토일"
LATEST_DAY = date(2026, 11, 1)
SAMPLE_TIMES = ("오전 8:38", "오후 6:12", "오전 8:21", "오후 5:47", "오전 7:55", "오후 7:03")

SESSION_SPECS = (
    SynthParams("pedestrian", seed=101),
    SynthParams("lead_brake", seed=201),
    SynthParams("normal", seed=301, n_events=4, overlap_count=2, harsh_accel_count=1),
    SynthParams("pedestrian", seed=102),
    SynthParams("lead_brake", seed=202),
    SynthParams("normal", seed=302, n_events=4, overlap_count=1),
)


def _score(curve: list[list[float]], value: float) -> float:
    xs, ys = zip(*curve)
    return float(np.interp(value, xs, ys))


def _rounded(values: np.ndarray, digits: int) -> list[float]:
    return [round(float(value), digits) for value in values]


def _series(session: SyntheticSession, start: int, end: int) -> dict[str, list[float]]:
    drive = session.drive
    index = np.arange(max(start, 0), min(end, drive.duration_ms), SAMPLE_DT_MS)
    return {
        "accel": _rounded(drive.accel_pct[index], 1),
        "brake": _rounded(drive.brake_pct[index], 1),
        "speedKmh": _rounded(drive.speed_mps[index] * 3.6, 1),
        "decelG": _rounded(drive.accel_mps2[index] / G_MPS2, 3),
        "foot": _rounded(drive.foot_pos[index], 2),
    }


def _stats(session: SyntheticSession, start: int, end: int) -> dict[str, float]:
    drive = session.drive
    return {
        "peakBrakePct": round(float(drive.brake_pct[start:end].max()), 1),
        "peakAccelG": round(float(max(0.0, drive.accel_mps2[start:end].max() / G_MPS2)), 2),
        "peakDecelG": round(float(max(0.0, -drive.accel_mps2[start:end].min() / G_MPS2)), 2),
        "speedStartKmh": round(float(drive.speed_mps[start] * 3.6), 1),
        "speedEndKmh": round(float(drive.speed_mps[min(end, drive.duration_ms - 1)] * 3.6), 1),
    }


def _hazard_entry(session: SyntheticSession, event, curves: dict) -> dict:
    start = max(event.t0 - PADDING_MS, 0)
    end = min(event.t7 + PADDING_MS, session.drive.duration_ms)
    marks = {"T0": event.t0, "T1": event.t1, "T2": event.t2, "T3": event.t3, "T4": event.t4, "T5": event.t5, "T6": event.t6, "T7": event.t7}
    recognition = event.t1 - event.t0
    transition = event.t4 - event.t2
    total = event.t4 - event.t0
    return {
        "type": event.event_type,
        "marks": [{"key": key, "ms": value - start} for key, value in marks.items()],
        "metrics": {
            "recognitionMs": recognition,
            "releaseMs": event.t2 - event.t1,
            "transitionMs": transition,
            "totalReactionMs": total,
            "riseMs": event.t5 - event.t4,
            "vehicleDelayMs": event.t6 - event.t4,
        },
        "stats": {**_stats(session, event.t0, event.t7), "accelBeforePct": round(float(session.drive.accel_pct[event.t1]), 1)},
        # 사양서 5.1의 반응성 지표 3개를 v1 곡선으로 환산한 평균이다. 사건 단위 점수 산식은 Phase 4에서 확정한다.
        "score": round(
            np.mean(
                [
                    _score(curves["recognition_to_release_ms"], recognition),
                    _score(curves["pedal_transition_ms"], transition),
                    _score(curves["total_brake_reaction_ms"], total),
                ]
            )
        ),
        "series": _series(session, start, end),
    }


def _routine_entry(session: SyntheticSession, span: tuple[int, int], accel_on, th: TruthThresholds) -> dict | None:
    drive = session.drive
    t4, t7 = span
    previous = [interval for interval in accel_on if interval[1] <= t4]
    if not previous:
        return None
    t2 = previous[-1][1]
    start = max(t2 - PADDING_MS, 0)
    end = min(t7 + PADDING_MS, drive.duration_ms)
    peak = float(drive.brake_pct[t4:t7].max())
    t5 = t4 + int(np.argmax(drive.brake_pct[t4:t7] >= th.t5_ratio * peak))
    decel = np.flatnonzero(drive.accel_mps2[t4:t7] <= th.t6_decel_g * G_MPS2)
    marks = {"T2": t2, "T4": t4, "T5": t5}
    if decel.size:
        marks["T6"] = t4 + int(decel[0])
    marks["T7"] = t7
    return {
        "type": "routine",
        "marks": [{"key": key, "ms": value - start} for key, value in marks.items()],
        "metrics": {"coastMs": t4 - t2, "riseMs": t5 - t4},
        "stats": _stats(session, t2, t7),
        "score": None,
        "series": _series(session, start, end),
    }


def _overlap_entry(session: SyntheticSession, span: tuple[int, int]) -> dict:
    drive = session.drive
    begin, finish = span
    start = max(begin - 1500, 0)
    end = min(finish + 1500, drive.duration_ms)
    return {
        "type": "overlap",
        "marks": [{"key": "O0", "ms": begin - start}, {"key": "O1", "ms": finish - start}],
        "metrics": {"overlapMs": finish - begin},
        "stats": {
            **_stats(session, begin, finish),
            "accelDuringPct": round(float(drive.accel_pct[begin:finish].mean()), 1),
        },
        "score": None,
        "series": _series(session, start, end),
    }


def _hard_accel_entry(session: SyntheticSession, span: tuple[int, int]) -> dict:
    drive = session.drive
    begin, finish = span
    start = max(begin - PADDING_MS, 0)
    end = min(finish + PADDING_MS, drive.duration_ms)
    return {
        "type": "hard_accel",
        "marks": [{"key": "A0", "ms": begin - start}, {"key": "A1", "ms": finish - start}],
        "metrics": {"hardAccelMs": finish - begin},
        "stats": _stats(session, begin, finish),
        "score": None,
        "series": _series(session, start, end),
    }


def _true_intervals(condition: np.ndarray) -> list[tuple[int, int]]:
    padded = np.pad(condition.astype(np.int8), (1, 1))
    changes = np.diff(padded)
    starts = np.flatnonzero(changes == 1)
    ends = np.flatnonzero(changes == -1)
    return list(zip(starts.tolist(), ends.tolist(), strict=True))


def _when(index: int) -> dict[str, str]:
    day = LATEST_DAY - timedelta(days=index // 2)
    return {
        "date": f"{day.month}월 {day.day}일 ({WEEKDAYS[day.weekday()]})",
        "time": SAMPLE_TIMES[index % len(SAMPLE_TIMES)],
    }


def _histogram(values, edges: list[float], weights=None, labels: list[str] | None = None) -> list[dict]:
    counts, _ = np.histogram(values, bins=edges, weights=weights)
    return [
        {"label": labels[i] if labels else f"{edges[i]:g}–{edges[i + 1]:g}", "value": round(float(counts[i]), 2)}
        for i in range(len(counts))
    ]


def _mean_curve(signal_segments: list[np.ndarray]) -> list[float]:
    return _rounded(np.mean(signal_segments, axis=0), 1)


def build_samples() -> dict:
    th = load_thresholds()
    config = yaml.safe_load(find_default_config().read_text(encoding="utf-8"))
    curves = config["scoring"]["curves"]
    sessions = [simulate_session(params, th) for params in SESSION_SPECS]

    entries: list[dict] = []
    transition_all: list[int] = []
    recognition_all: list[int] = []
    release_all: list[int] = []
    rise_all: list[int] = []
    delay_all: list[int] = []
    brake_peaks: list[float] = []
    hazard_curves: list[np.ndarray] = []
    routine_curves: list[np.ndarray] = []
    accel_samples: list[np.ndarray] = []
    usage_ms = {"accel": 0, "coast": 0, "brake": 0, "both": 0}
    distance_km = 0.0
    duration_ms = 0
    hard_brakes = 0
    hard_accels = 0
    step = CURVE_STEP_MS
    curve_index = np.arange(0, CURVE_LENGTH_MS + 1, step)

    for session in sessions:
        drive = session.drive
        accel_on = on_intervals(drive.accel_pct, th.on_pct, th.off_pct, th.debounce_ms)
        brake_on = on_intervals(drive.brake_pct, th.on_pct, th.off_pct, th.debounce_ms)
        drive_start = drive.sync_end_ms
        moving = drive.speed_mps > 0.0
        accel_active = np.zeros(drive.duration_ms, dtype=bool)
        brake_active = np.zeros(drive.duration_ms, dtype=bool)
        for begin, finish in accel_on:
            accel_active[begin:finish] = True
        for begin, finish in brake_on:
            brake_active[begin:finish] = True
        usage_ms["accel"] += int((moving & accel_active & ~brake_active).sum())
        usage_ms["brake"] += int((moving & brake_active & ~accel_active).sum())
        usage_ms["both"] += int((moving & accel_active & brake_active).sum())
        usage_ms["coast"] += int((moving & ~accel_active & ~brake_active).sum())
        habits = session.truth["habit_metrics"]
        distance_km += habits["distance_km"]
        duration_ms += drive.duration_ms
        hard_brakes += habits["hard_brake_count"]
        hard_accels += habits["hard_accel_count"]
        accel_samples.append(drive.accel_pct[accel_active])

        hazards = drive.events
        for event in hazards:
            recognition_all.append(event.t1 - event.t0)
            release_all.append(event.t2 - event.t1)
            transition_all.append(event.t4 - event.t2)
            rise_all.append(event.t5 - event.t4)
            delay_all.append(event.t6 - event.t4)
            hazard_curves.append(drive.brake_pct[event.t4 + curve_index])
        for event in hazards[:HAZARDS_PER_SESSION]:
            entries.append(_hazard_entry(session, event, curves))

        overlap_spans = []
        for accel_span in accel_on:
            for brake_span in brake_on:
                begin, finish = max(accel_span[0], brake_span[0]), min(accel_span[1], brake_span[1])
                if begin < finish:
                    overlap_spans.append((begin, finish))
        overlap_brakes = {span for span in brake_on if any(span[0] <= o[0] < span[1] for o in overlap_spans)}
        routine_spans = []
        for span in brake_on:
            if span[0] < drive_start or span in overlap_brakes:
                continue
            brake_peaks.append(float(drive.brake_pct[span[0] : span[1]].max()))
            if params_is_normal(session):
                routine_spans.append(span)
                if span[0] + CURVE_LENGTH_MS < drive.duration_ms:
                    routine_curves.append(drive.brake_pct[span[0] + curve_index])
        if params_is_normal(session):
            for span in routine_spans[:1]:
                routine = _routine_entry(session, span, accel_on, th)
                if routine:
                    entries.append(routine)
            for span in overlap_spans[:1]:
                entries.append(_overlap_entry(session, span))
            hard_accel_spans = _true_intervals(drive.accel_mps2 >= th.hard_accel_g * G_MPS2)
            for span in hard_accel_spans[:1]:
                entries.append(_hard_accel_entry(session, span))

    entries.sort(key=lambda entry: (entry["series"]["speedKmh"][0], entry["type"]))
    for index, entry in enumerate(entries):
        entry["id"] = f"E{index + 1:02d}"
        entry.update(_when(index))

    accel_values = np.concatenate(accel_samples)
    usage_total = sum(usage_ms.values())
    transition = np.array(transition_all)
    return {
        "source": "psi_synth 합성 세션의 정답값",
        "configVersion": th.config_version,
        "thresholds": {
            "hardAccelG": config["habits"]["hard_accel_g"],
            "hardBrakeG": config["habits"]["hard_brake_g"],
        },
        "scope": {
            "sessions": len(sessions),
            "distanceKm": round(distance_km, 1),
            "drivingMinutes": round(duration_ms / 60_000, 1),
            "hazardEvents": len(transition_all),
            "hardBrakes": hard_brakes,
            "hardAccels": hard_accels,
        },
        "averages": {
            "recognitionMs": round(float(np.mean(recognition_all))),
            "releaseMs": round(float(np.mean(release_all))),
            "transitionMs": round(float(np.mean(transition_all))),
            "totalReactionMs": round(float(np.mean(recognition_all) + np.mean(release_all) + np.mean(transition_all))),
            "riseMs": round(float(np.mean(rise_all))),
            "vehicleDelayMs": round(float(np.mean(delay_all))),
            "accelPct": round(float(accel_values.mean()), 1),
            "accelCv": round(float(accel_values.std() / accel_values.mean()), 2),
            "peakBrakePct": round(float(np.mean(brake_peaks)), 1),
        },
        "usage": {key: round(value / usage_total * 100, 1) for key, value in usage_ms.items()},
        "accelHistogram": _histogram(
            accel_values,
            [0, 10, 15, 20, 25, 30, 35, 40, 60, 100],
            weights=np.full(accel_values.size, 100.0 / accel_values.size),
        ),
        "brakePeakHistogram": _histogram(brake_peaks, [0, 20, 40, 60, 80, 100]),
        "transitionHistogram": _histogram(
            transition,
            [0, 200, 300, 400, 500, 10_000],
            labels=["200 이하", "200–300", "300–400", "400–500", "500 초과"],
        ),
        "transitionFullScoreMs": curves["pedal_transition_ms"][0][0],
        "transitionZeroScoreMs": curves["pedal_transition_ms"][1][0],
        "brakeCurve": {
            "stepMs": CURVE_STEP_MS,
            "hazard": _mean_curve(hazard_curves),
            "routine": _mean_curve(routine_curves),
        },
        "events": entries,
    }


def params_is_normal(session: SyntheticSession) -> bool:
    return session.params.scenario == "normal"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    args.out.write_text(json.dumps(build_samples(), ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
