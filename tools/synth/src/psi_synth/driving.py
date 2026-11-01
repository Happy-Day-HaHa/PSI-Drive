"""시나리오별 페달 조작과 차량 응답을 1kHz로 시뮬레이션한다. 시간은 세션 시작 기준 정수 ms다."""

from dataclasses import dataclass

import numpy as np

from psi_synth.truth import G_MPS2, TruthThresholds

LED_AFTER_TAP_MS = 20
LED_DURATION_MS = 200
STOP_SEARCH_MS = 25_000
TAIL_MS = 3_000


@dataclass(frozen=True)
class VehicleParams:
    accel_gain_mps2: float = 4.0
    brake_decel_mps2: float = 10.0
    drag_per_s: float = 0.03
    response_tau_s: float = 0.12
    brake_delay_ms: int = 90


@dataclass
class HazardEvent:
    event_type: str
    t0: int
    t1: int
    t2: int
    t3: int
    t4: int
    t5: int
    t6: int
    t7: int
    release_start: int
    release_end: int


@dataclass
class DriveScript:
    accel_pct: np.ndarray
    brake_pct: np.ndarray
    foot_pos: np.ndarray
    speed_mps: np.ndarray
    accel_mps2: np.ndarray
    distance_m: np.ndarray
    events: list[HazardEvent]
    stationary_ms: int | None
    tap_ms: int | None
    flash_ms: int | None
    sync_end_ms: int
    vehicle: VehicleParams

    @property
    def duration_ms(self) -> int:
        return len(self.accel_pct)


class _Keys:
    """구간 선형 키프레임. 시간은 항상 증가해야 한다."""

    def __init__(self) -> None:
        self.times = [0]
        self.values = [0.0]

    def to(self, t: int, value: float) -> None:
        if t <= self.times[-1]:
            raise ValueError(f"keyframe {t} is not after {self.times[-1]}")
        self.times.append(t)
        self.values.append(float(value))

    def hold(self, t: int) -> None:
        if t > self.times[-1]:
            self.to(t, self.values[-1])

    def move(self, start: int, end: int, value: float) -> None:
        self.hold(start)
        if end > self.times[-1]:
            self.to(end, value)

    def sample(self, n: int) -> np.ndarray:
        return np.interp(np.arange(n), self.times, self.values)


def simulate_vehicle(
    accel_pct: np.ndarray, brake_pct: np.ndarray, vehicle: VehicleParams
) -> tuple[np.ndarray, np.ndarray]:
    dt = 0.001
    n = len(accel_pct)
    accel_values = accel_pct.tolist()
    brake_values = brake_pct.tolist()
    speed = [0.0] * n
    long_accel = [0.0] * n
    v = 0.0
    a = 0.0
    blend = dt / vehicle.response_tau_s
    for i in range(n):
        delayed = brake_values[i - vehicle.brake_delay_ms] if i >= vehicle.brake_delay_ms else 0.0
        target = (
            vehicle.accel_gain_mps2 * accel_values[i] / 100.0
            - vehicle.brake_decel_mps2 * delayed / 100.0
            - vehicle.drag_per_s * v
        )
        if v <= 0.0 and target <= 0.0:
            target = 0.0
            a = 0.0
        a += (target - a) * blend
        v += a * dt
        if v <= 0.0:
            v = 0.0
            if a < 0.0:
                a = 0.0
        speed[i] = v
        long_accel[i] = a
    return np.array(speed), np.array(long_accel)


def _first(condition: np.ndarray, start: int) -> int:
    hits = np.flatnonzero(condition[start:])
    if hits.size == 0:
        raise ValueError(f"condition never met after {start} ms")
    return start + int(hits[0])


class _Builder:
    def __init__(self, rng: np.random.Generator, vehicle: VehicleParams) -> None:
        self.rng = rng
        self.vehicle = vehicle
        self.accel = _Keys()
        self.brake = _Keys()
        self.foot = _Keys()
        self.ripple_phase = rng.uniform(0, 2 * np.pi, size=2)
        self.plans: list[dict] = []

    def ms(self, low: int, high: int) -> int:
        return int(self.rng.integers(low, high + 1))

    def accel_signal(self, n: int) -> np.ndarray:
        t_s = np.arange(n) / 1000.0
        ripple = (
            1.0
            + 0.12 * np.sin(2 * np.pi * t_s / 7.0 + self.ripple_phase[0])
            + 0.05 * np.sin(2 * np.pi * t_s / 2.3 + self.ripple_phase[1])
        )
        return self.accel.sample(n) * ripple

    def pull_away(self, t: int) -> int:
        self.foot.move(t - 300, t, 0.0)
        pull = self.rng.uniform(25.0, 35.0)
        cruise = self.rng.uniform(15.0, 22.0)
        self.accel.hold(t)
        self.accel.to(t + 800, pull)
        end = t + 800 + self.ms(4000, 6000)
        self.accel.to(end, cruise)
        return end

    def overlap(self, t: int) -> None:
        peak = self.rng.uniform(12.0, 30.0)
        hold = self.ms(300, 800)
        self.brake.hold(t)
        self.brake.to(t + 100, peak)
        self.brake.to(t + 100 + hold, peak)
        self.brake.to(t + 200 + hold, 0.0)

    def harsh_accel(self, t: int) -> None:
        cruise = self.accel.values[-1]
        self.accel.hold(t)
        self.accel.to(t + 300, 90.0)
        self.accel.to(t + 2300, 90.0)
        self.accel.to(t + 3300, cruise)

    def hazard(self, t0: int, event_type: str) -> int:
        rng = self.rng
        t1 = t0 + int(np.clip(rng.normal(520, 130), 250, 1200))
        ramp = self.ms(60, 180)
        t2_plan = t1 + ramp
        t3 = t1 + int(rng.uniform(0.5, 1.0) * ramp)
        self.accel.hold(t1)
        self.accel.to(t2_plan, 0.0)
        t4 = t2_plan + int(np.clip(rng.normal(320, 90), 120, 650))
        self.foot.move(t3, t4, 1.0)
        rise = self.ms(120, 500)
        peak = rng.uniform(70.0, 95.0) if event_type == "pedestrian" else rng.uniform(45.0, 75.0)
        self.brake.hold(t4)
        self.brake.to(t4 + rise, peak)

        n = t4 + rise + STOP_SEARCH_MS
        speed, _ = simulate_vehicle(self.accel_signal(n), self.brake.sample(n), self.vehicle)
        if event_type == "pedestrian":
            release = _first(speed <= 0.0, t4 + 1) + self.ms(800, 1800)
        else:
            release = _first(speed <= rng.uniform(0.4, 0.7) * speed[t4], t4 + 1)
        release = max(release, t4 + rise + 200)
        release_end = release + self.ms(300, 700)
        self.brake.to(release, peak)
        self.brake.to(release_end, 0.0)
        self.plans.append(
            {
                "event_type": event_type,
                "t0": t0,
                "t1": t1,
                "t3": t3,
                "t4": t4,
                "release_start": release,
                "release_end": release_end,
            }
        )
        return self.pull_away(release_end + self.ms(300, 1000))

    def routine_brake(self, t: int) -> int:
        self.accel.hold(t)
        lift_end = t + self.ms(300, 700)
        self.accel.to(lift_end, 0.0)
        t4 = lift_end + self.ms(1000, 4000)
        self.foot.move(t4 - 400, t4, 1.0)
        peak = self.rng.uniform(15.0, 35.0)
        rise_end = t4 + self.ms(800, 1200)
        release = rise_end + self.ms(1000, 2500)
        release_end = release + self.ms(500, 900)
        self.brake.hold(t4)
        self.brake.to(rise_end, peak)
        self.brake.to(release, peak)
        self.brake.to(release_end, 0.0)
        return self.pull_away(release_end + self.ms(400, 1000))


def _finalize_event(plan: dict, accel: np.ndarray, brake: np.ndarray, speed: np.ndarray, long_accel: np.ndarray,
                    th: TruthThresholds) -> HazardEvent:
    t4 = plan["t4"]
    t2 = _first(accel <= th.off_pct, plan["t1"])
    peak = float(brake[t4 : plan["release_end"] + 1].max())
    t5 = _first(brake >= th.t5_ratio * peak, t4)
    t6 = _first(long_accel <= th.t6_decel_g * G_MPS2, t4)
    stop = _first(speed <= 0.0, t4 + 1) if np.any(speed[t4 + 1 :] <= 0.0) else len(speed)
    brake_off = _first(brake <= th.off_pct, plan["release_start"])
    t7 = stop if plan["event_type"] == "pedestrian" else min(stop, brake_off)
    return HazardEvent(t2=t2, t5=t5, t6=t6, t7=t7, **plan)


def build_drive(
    scenario: str,
    n_events: int,
    overlap_count: int,
    harsh_accel_count: int,
    min_duration_s: float,
    no_sync_gesture: bool,
    rng: np.random.Generator,
    th: TruthThresholds,
) -> DriveScript:
    vehicle = VehicleParams(brake_delay_ms=int(rng.integers(60, 121)))
    b = _Builder(rng, vehicle)

    t = b.ms(1500, 2500)
    stationary_ms = None
    tap_ms = None
    flash_ms = None
    if not no_sync_gesture:
        tap_ms = t
        stationary_ms = t - 500
        flash_ms = tap_ms + LED_AFTER_TAP_MS
        b.foot.move(t - 600, t - 100, 1.0)
        b.brake.hold(t)
        b.brake.to(t + 60, 40.0)
        b.brake.to(t + 160, 40.0)
        b.brake.to(t + 260, 0.0)
        t += 260
    t += b.ms(1500, 2500)
    sync_end_ms = t
    t = b.pull_away(t)

    for i in range(max(n_events, overlap_count, harsh_accel_count)):
        gap = b.ms(8000, 14000)
        if i < overlap_count:
            b.overlap(t + 2000)
        if i < harsh_accel_count:
            b.harsh_accel(t + 4000)
        t += gap
        if i < n_events:
            t = b.routine_brake(t) if scenario == "normal" else b.hazard(t, scenario)

    n = max(t + TAIL_MS, int(min_duration_s * 1000))
    accel = b.accel_signal(n)
    brake = b.brake.sample(n)
    foot = b.foot.sample(n)
    speed, long_accel = simulate_vehicle(accel, brake, vehicle)
    events = [_finalize_event(plan, accel, brake, speed, long_accel, th) for plan in b.plans]
    return DriveScript(
        accel_pct=accel,
        brake_pct=brake,
        foot_pos=foot,
        speed_mps=speed,
        accel_mps2=long_accel,
        distance_m=np.cumsum(speed) * 0.001,
        events=events,
        stationary_ms=stationary_ms,
        tap_ms=tap_ms,
        flash_ms=flash_ms,
        sync_end_ms=sync_end_ms,
        vehicle=vehicle,
    )
