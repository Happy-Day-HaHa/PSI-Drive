"""세션 ZIP(Ingest Format v1)과 정답 JSON을 디스크에 쓴다."""

import json
import tempfile
import zipfile
from datetime import UTC, datetime
from pathlib import Path

from psi_synth.session import SyntheticSession

FIXED_ZIP_TIME = (2026, 1, 1, 0, 0, 0)
CSV_MEMBERS = {
    "front_frames": "front_frames.csv",
    "foot_frames": "foot_frames.csv",
    "pedal": "pedal.csv",
    "imu": "imu.csv",
    "gnss": "gnss.csv",
    "sync_markers": "sync_markers.csv",
}


def session_stem(session: SyntheticSession) -> str:
    start = datetime.fromtimestamp(session.start_utc_us // 1_000_000, UTC).strftime("%Y%m%dT%H%M%SZ")
    return f"session_{session.manifest['device_id']}_{start}"


def _write_text(archive: zipfile.ZipFile, name: str, text: str) -> None:
    info = zipfile.ZipInfo(name, date_time=FIXED_ZIP_TIME)
    info.compress_type = zipfile.ZIP_DEFLATED
    archive.writestr(info, text)


def write_session(session: SyntheticSession, out_dir: Path, video_scale: float = 1.0) -> tuple[Path, Path]:
    """(세션 ZIP 경로, 정답 JSON 경로)를 돌려준다. 정답은 파서가 볼 수 없게 ZIP 밖에 둔다."""
    # render는 session 모듈을 쓰므로 영상이 필요 없는 호출 경로의 import 비용을 줄이려 여기서 불러온다.
    from psi_synth.render import render_video

    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = session_stem(session)
    zip_path = out_dir / f"{stem}.zip"
    truth_path = out_dir / f"{stem}.truth.json"

    with tempfile.TemporaryDirectory(dir=out_dir) as tmp, zipfile.ZipFile(zip_path, "w") as archive:
        _write_text(archive, "manifest.json", json.dumps(session.manifest, indent=2, ensure_ascii=False))
        for stream in ("front", "foot"):
            video = Path(tmp) / f"{stream}.mp4"
            render_video(session, stream, video, video_scale)
            info = zipfile.ZipInfo(video.name, date_time=FIXED_ZIP_TIME)
            info.compress_type = zipfile.ZIP_STORED
            with video.open("rb") as source, archive.open(info, "w", force_zip64=True) as target:
                while chunk := source.read(1 << 20):
                    target.write(chunk)
        for key, member in CSV_MEMBERS.items():
            _write_text(archive, member, session.tables[key].to_csv(index=False))

    truth_path.write_text(json.dumps(session.truth, indent=2, ensure_ascii=False), encoding="utf-8")
    return zip_path, truth_path
