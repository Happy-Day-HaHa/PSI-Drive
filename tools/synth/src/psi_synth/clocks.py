"""스트림별 장비 클록 모델. master_ts = device_ts × (1 + drift) + offset."""

from dataclasses import dataclass

import numpy as np

from psi_synth.params import CLOCK_NAMES, Injection

# 장비 클록은 세션 시작보다 이만큼 먼저 켜졌다고 본다. 타임스탬프가 음수가 되지 않게 한다.
BOOT_LEAD_US = 5_000_000


@dataclass(frozen=True)
class ClockModel:
    offset_us: int
    drift_ppm: float
    injected_offset_us: int

    def to_device(self, master_us: np.ndarray) -> np.ndarray:
        elapsed = np.asarray(master_us, dtype=np.int64) - self.offset_us
        return np.rint(elapsed / (1.0 + self.drift_ppm * 1e-6)).astype(np.int64)

    def to_master(self, device_us: np.ndarray) -> np.ndarray:
        device = np.asarray(device_us, dtype=np.int64)
        return np.rint(device * (1.0 + self.drift_ppm * 1e-6)).astype(np.int64) + self.offset_us


def draw_clocks(rng: np.random.Generator, injection: Injection, start_utc_us: int) -> dict[str, ClockModel]:
    if injection.max_offset_us >= BOOT_LEAD_US:
        raise ValueError("max_offset_us must be smaller than BOOT_LEAD_US")
    clocks = {}
    for name in CLOCK_NAMES:
        injected = int(rng.integers(-injection.max_offset_us, injection.max_offset_us + 1))
        drift = float(rng.uniform(-injection.max_drift_ppm, injection.max_drift_ppm))
        injected, drift = injection.clock_overrides.get(name, (injected, drift))
        clocks[name] = ClockModel(start_utc_us - BOOT_LEAD_US + injected, drift, injected)
    return clocks
