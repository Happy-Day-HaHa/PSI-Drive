"""영상 컨테이너 검증. ffmpeg가 필요하므로 파싱과 분리한 선택 단계다."""

import tempfile
import zipfile
from pathlib import Path

from psi_signal.ingest.models import IngestIssue, ParsedSession


def verify_video_frames(session: ParsedSession) -> dict[str, int]:
    """mp4 실제 프레임 수를 세어 frames.csv 행 수와 다르면 issue를 추가한다."""
    import imageio_ffmpeg

    counts = {}
    with zipfile.ZipFile(session.source) as archive, tempfile.TemporaryDirectory() as tmp:
        for stream in (session.front, session.foot):
            target = Path(tmp) / f"{stream.name}.mp4"
            with archive.open(stream.member) as source, target.open("wb") as output:
                while chunk := source.read(1 << 20):
                    output.write(chunk)
            count, _ = imageio_ffmpeg.count_frames_and_secs(str(target))
            counts[stream.name] = count
            if count != stream.frame_idx.size:
                session.issues.append(
                    IngestIssue(
                        "video_frame_count_mismatch",
                        f"{stream.name}: mp4 has {count} frames, frames.csv has {stream.frame_idx.size}",
                    )
                )
    return counts
