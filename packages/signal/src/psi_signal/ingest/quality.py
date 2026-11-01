"""타임스탬프 간격 기반 결측 추정."""

from dataclasses import dataclass

import numpy as np

GAP_FACTOR = 1.5


@dataclass(frozen=True)
class GapStats:
    """기대 간격의 GAP_FACTOR배를 넘는 간격을 결측으로 본다."""

    expected: int
    received: int
    missing: int
    missing_rate: float
    largest_gap_us: int


def gap_stats(device_ts_us: np.ndarray, nominal_hz: float) -> GapStats:
    period = 1e6 / nominal_hz
    received = int(device_ts_us.size)
    if received < 2:
        return GapStats(received, received, 0, 0.0, 0)
    gaps = np.diff(device_ts_us)
    large = gaps[gaps > GAP_FACTOR * period]
    missing = int(np.rint(large / period).sum()) - large.size
    expected = received + missing
    return GapStats(expected, received, missing, missing / expected, int(gaps.max()))
