"""합성 세션 생성 CLI. 예: python -m psi_synth --scenario pedestrian --seed 1 --out out/"""

import argparse
from pathlib import Path

from psi_synth.package import write_session
from psi_synth.params import MARKER_TYPES, SCENARIOS, Injection, SynthParams
from psi_synth.session import simulate_session


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="psi-synth", description=__doc__)
    parser.add_argument("--scenario", choices=SCENARIOS, required=True)
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument("--count", type=int, default=1, help="seed부터 연속으로 생성할 세션 수")
    parser.add_argument("--out", type=Path, default=Path("out"))
    parser.add_argument("--events", type=int, default=3)
    parser.add_argument("--overlaps", type=int, default=0)
    parser.add_argument("--harsh-accels", type=int, default=0)
    parser.add_argument("--min-duration-s", type=float, default=0.0)
    parser.add_argument("--foot-fps", type=float, default=30.0)
    parser.add_argument("--pedal-hz", type=int, default=500)
    parser.add_argument("--video-scale", type=float, default=1.0, help="1.0이면 사양 해상도, 낮추면 빠르게 생성")
    parser.add_argument("--max-offset-ms", type=int, default=300)
    parser.add_argument("--max-drift-ppm", type=float, default=50.0)
    parser.add_argument("--frame-drop", type=float, default=0.0)
    parser.add_argument("--sensor-gaps", type=int, default=0)
    parser.add_argument("--pedal-zero-bias", type=int, default=0)
    parser.add_argument("--omit-marker", action="append", default=[], choices=MARKER_TYPES)
    parser.add_argument("--no-sync-gesture", action="store_true")
    parser.add_argument("--gnss-outage", type=float, nargs=2, metavar=("START_S", "DURATION_S"))
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    injection = Injection(
        max_offset_us=args.max_offset_ms * 1000,
        max_drift_ppm=args.max_drift_ppm,
        frame_drop_rate=args.frame_drop,
        sensor_gap_count=args.sensor_gaps,
        pedal_zero_bias_counts=args.pedal_zero_bias,
        omit_markers=tuple(args.omit_marker),
        no_sync_gesture=args.no_sync_gesture,
        gnss_outage_s=tuple(args.gnss_outage) if args.gnss_outage else None,
    )
    for seed in range(args.seed, args.seed + args.count):
        params = SynthParams(
            scenario=args.scenario,
            seed=seed,
            n_events=args.events,
            overlap_count=args.overlaps,
            harsh_accel_count=args.harsh_accels,
            min_duration_s=args.min_duration_s,
            foot_fps=args.foot_fps,
            pedal_hz=args.pedal_hz,
            injection=injection,
        )
        zip_path, truth_path = write_session(simulate_session(params), args.out, args.video_scale)
        print(f"{zip_path}\n{truth_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
