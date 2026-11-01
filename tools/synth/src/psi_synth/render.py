"""검증용 단순 영상 렌더링. 움직이는 도형과 LED 플래시 패치만 그린다."""

from pathlib import Path

import imageio_ffmpeg
import numpy as np

from psi_synth.driving import LED_DURATION_MS
from psi_synth.session import SyntheticSession, VIDEO_SIZES


def scaled_size(stream: str, scale: float) -> tuple[int, int]:
    width, height = VIDEO_SIZES[stream]
    return max(16, int(width * scale) // 2 * 2), max(16, int(height * scale) // 2 * 2)


def led_box(width: int, height: int) -> tuple[int, int, int, int]:
    """LED 패치 영역 (x0, y0, x1, y1). 영상 기반 플래시 검출에서도 같은 위치를 쓴다."""
    size = max(8, width // 16)
    return width - size - 2, 2, width - 2, 2 + size


def _rect(frame: np.ndarray, x0: float, y0: float, x1: float, y1: float, color: tuple[int, int, int]) -> None:
    height, width = frame.shape[:2]
    frame[max(0, int(y0)) : min(height, int(y1)), max(0, int(x0)) : min(width, int(x1))] = color


def _draw_led(frame: np.ndarray, lit: bool) -> None:
    height, width = frame.shape[:2]
    x0, y0, x1, y1 = led_box(width, height)
    _rect(frame, x0, y0, x1, y1, (255, 255, 255) if lit else (24, 24, 24))


def _front_frame(base: np.ndarray, ms: int, session: SyntheticSession, lit: bool) -> np.ndarray:
    frame = base.copy()
    height, width = frame.shape[:2]
    drive = session.drive
    # 차선 점선은 이동 거리에 따라 내려와 주행 중임을 보여 준다.
    dash_period = max(8, height // 6)
    shift = int(drive.distance_m[ms] * 8) % dash_period
    for y in range(height // 2 + shift, height, dash_period):
        _rect(frame, width * 0.49, y, width * 0.51, y + dash_period / 2, (235, 235, 235))
    for event in drive.events:
        if not event.t0 <= ms <= event.t7:
            continue
        if event.event_type == "pedestrian":
            _rect(frame, width * 0.55, height * 0.42, width * 0.60, height * 0.72, (230, 120, 30))
    if session.params.scenario == "lead_brake":
        _rect(frame, width * 0.42, height * 0.42, width * 0.58, height * 0.58, (40, 40, 60))
        braking = any(event.t0 <= ms <= event.t7 for event in drive.events)
        light = (255, 40, 40) if braking else (90, 20, 20)
        _rect(frame, width * 0.43, height * 0.48, width * 0.46, height * 0.52, light)
        _rect(frame, width * 0.54, height * 0.48, width * 0.57, height * 0.52, light)
    _draw_led(frame, lit)
    return frame


def _foot_frame(base: np.ndarray, ms: int, session: SyntheticSession, lit: bool) -> np.ndarray:
    frame = base.copy()
    height, width = frame.shape[:2]
    drive = session.drive
    accel_x, brake_x = width * 0.68, width * 0.32
    accel_press = drive.accel_pct[ms] / 100.0
    brake_press = drive.brake_pct[ms] / 100.0
    _rect(frame, accel_x - width * 0.05, height * (0.30 + 0.12 * accel_press), accel_x + width * 0.05, height * 0.85, (60, 120, 220))
    _rect(frame, brake_x - width * 0.08, height * (0.42 + 0.12 * brake_press), brake_x + width * 0.08, height * 0.75, (210, 60, 60))
    foot_x = accel_x + (brake_x - accel_x) * drive.foot_pos[ms]
    foot_y = height * (0.55 + 0.08 * max(accel_press, brake_press))
    _rect(frame, foot_x - width * 0.045, foot_y - height * 0.22, foot_x + width * 0.045, foot_y + height * 0.12, (225, 195, 160))
    _draw_led(frame, lit)
    return frame


def _base_image(stream: str, width: int, height: int) -> np.ndarray:
    base = np.zeros((height, width, 3), dtype=np.uint8)
    if stream == "front":
        base[: height // 2] = (150, 190, 225)
        base[height // 2 :] = (75, 78, 82)
    else:
        base[:] = (38, 40, 46)
    return base


def render_video(session: SyntheticSession, stream: str, path: Path, scale: float = 1.0) -> int:
    """프레임 드롭이 반영된 프레임만 H.264로 인코딩하고 프레임 수를 돌려준다."""
    width, height = scaled_size(stream, scale)
    fps = session.params.front_fps if stream == "front" else session.params.foot_fps
    draw = _front_frame if stream == "front" else _foot_frame
    base = _base_image(stream, width, height)
    drive = session.drive
    rel_us = session.frame_rel_us[stream]
    writer = imageio_ffmpeg.write_frames(
        str(path),
        (width, height),
        fps=fps,
        codec="libx264",
        macro_block_size=1,
        pix_fmt_in="rgb24",
        pix_fmt_out="yuv420p",
        quality=None,
        output_params=["-preset", "veryfast", "-crf", "26"],
        ffmpeg_log_level="error",
    )
    writer.send(None)
    try:
        for rel in rel_us.tolist():
            ms = min(rel // 1000, drive.duration_ms - 1)
            lit = drive.flash_ms is not None and drive.flash_ms * 1000 <= rel < (drive.flash_ms + LED_DURATION_MS) * 1000
            writer.send(draw(base, ms, session, lit).tobytes())
    finally:
        writer.close()
    return int(rel_us.size)
