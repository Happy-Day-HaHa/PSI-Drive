"""정답 계산에 쓰는 임계값 로딩과 깨끗한 신호 분석. 값은 점수 설정 파일을 단일 출처로 삼는다."""

from dataclasses import dataclass
from pathlib import Path

import numpy as np
import yaml

CONFIG_RELATIVE = Path("config") / "scoring_config.v1.yaml"
G_MPS2 = 9.80665


@dataclass(frozen=True)
class TruthThresholds:
    config_version: str
    on_pct: float
    off_pct: float
    debounce_ms: int
    t5_ratio: float
    t6_decel_g: float
    hard_accel_g: float
    hard_brake_g: float


def find_default_config() -> Path:
    for parent in Path(__file__).resolve().parents:
        candidate = parent / CONFIG_RELATIVE
        if candidate.is_file():
            return candidate
    raise FileNotFoundError(f"{CONFIG_RELATIVE} not found above {__file__}")


def load_thresholds(path: Path | None = None) -> TruthThresholds:
    config = yaml.safe_load((path or find_default_config()).read_text(encoding="utf-8"))
    detection = config["event_detection"]
    pedal = detection["pedal"]
    habits = config["habits"]
    return TruthThresholds(
        config_version=config["version"],
        on_pct=pedal["on_threshold_pct"],
        off_pct=pedal["off_threshold_pct"],
        debounce_ms=pedal["debounce_ms"],
        t5_ratio=detection["t5_brake_force_ratio"],
        t6_decel_g=detection["t6_decel_threshold_g"],
        hard_accel_g=habits["hard_accel_g"],
        hard_brake_g=habits["hard_brake_g"],
    )


def on_intervals(signal: np.ndarray, on_pct: float, off_pct: float, debounce_ms: int) -> list[tuple[int, int]]:
    """1kHz 신호의 ON 구간 [시작 ms, 끝 ms)를 찾는다. 시작은 기저선을 벗어나는 onset이다."""
    values = signal.tolist()
    intervals: list[tuple[int, int]] = []
    previous_end = 0
    active_start = None
    run = 0
    for i, value in enumerate(values):
        if active_start is None:
            run = run + 1 if value >= on_pct else 0
            if run >= debounce_ms:
                onset = i - run + 1
                while onset > previous_end and values[onset - 1] > 1e-9:
                    onset -= 1
                active_start = max(onset - 1, previous_end)
                run = 0
        else:
            run = run + 1 if value <= off_pct else 0
            if run >= debounce_ms:
                end = i - run + 1
                intervals.append((active_start, end))
                previous_end = end
                active_start = None
                run = 0
    if active_start is not None:
        intervals.append((active_start, len(values)))
    return intervals


def intersect(a: list[tuple[int, int]], b: list[tuple[int, int]]) -> list[tuple[int, int]]:
    result = []
    i = j = 0
    while i < len(a) and j < len(b):
        start = max(a[i][0], b[j][0])
        end = min(a[i][1], b[j][1])
        if start < end:
            result.append((start, end))
        if a[i][1] < b[j][1]:
            i += 1
        else:
            j += 1
    return result


def count_rising_edges(condition: np.ndarray) -> int:
    return int(np.count_nonzero(condition[1:] & ~condition[:-1]) + int(condition[0]))
