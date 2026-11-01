"""생성기 입력 파라미터."""

from collections.abc import Mapping
from dataclasses import dataclass, field

SCENARIOS = ("pedestrian", "lead_brake", "normal")
MARKER_TYPES = ("pps", "led_flash", "brake_tap", "stationary")
CLOCK_NAMES = ("front", "foot", "pedal", "motion")


@dataclass(frozen=True)
class Injection:
    """실제 장비에서 생길 수 있는 오차와 결함."""

    max_offset_us: int = 300_000
    max_drift_ppm: float = 50.0
    # 클록 이름 -> (주입 오프셋 µs, 드리프트 ppm). 지정하지 않은 클록은 무작위로 뽑는다.
    clock_overrides: Mapping[str, tuple[int, float]] = field(default_factory=dict)
    pedal_noise_counts: float = 6.0
    pedal_zero_bias_counts: int = 0
    imu_noise_mps2: float = 0.05
    gnss_speed_noise_mps: float = 0.05
    sample_jitter_us: float = 20.0
    frame_jitter_us: float = 100.0
    pps_jitter_us: float = 10.0
    frame_drop_rate: float = 0.0
    sensor_gap_count: int = 0
    sensor_gap_ms: tuple[int, int] = (100, 400)
    omit_markers: tuple[str, ...] = ()
    # True면 LED 플래시와 브레이크 탭 절차 자체가 없었던 세션을 만든다.
    no_sync_gesture: bool = False
    # (시작 초, 지속 초). 세션 시작 기준 GNSS 단절 구간이며 그동안 PPS도 끊긴다.
    gnss_outage_s: tuple[float, float] | None = None


@dataclass(frozen=True)
class SynthParams:
    scenario: str
    seed: int = 0
    # pedestrian/lead_brake는 위험 사건 수, normal은 일상 감속 수.
    n_events: int = 3
    overlap_count: int = 0
    harsh_accel_count: int = 0
    min_duration_s: float = 0.0
    front_fps: float = 30.0
    foot_fps: float = 30.0
    pedal_hz: int = 500
    imu_hz: int = 200
    gnss_hz: int = 10
    injection: Injection = field(default_factory=Injection)

    def __post_init__(self) -> None:
        if self.scenario not in SCENARIOS:
            raise ValueError(f"unknown scenario: {self.scenario}")
        unknown = set(self.injection.omit_markers) - set(MARKER_TYPES)
        if unknown:
            raise ValueError(f"unknown marker types: {sorted(unknown)}")
