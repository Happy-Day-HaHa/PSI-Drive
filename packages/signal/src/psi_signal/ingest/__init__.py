"""원시 세션 패키지 파서. 새 펌웨어 포맷은 어댑터만 추가해 지원한다."""

from psi_signal.ingest.adapters import IngestAdapter, get_adapters, parse_session, register_adapter
from psi_signal.ingest.models import (
    GnssData,
    ImuData,
    IngestError,
    IngestIssue,
    Manifest,
    ParsedSession,
    PedalData,
    SyncMarkers,
    VideoStream,
)
from psi_signal.ingest.quality import GapStats, gap_stats
from psi_signal.ingest.video import verify_video_frames
from psi_signal.ingest import v1 as _v1  # noqa: F401  v1 어댑터를 등록한다.

__all__ = [
    "GapStats",
    "GnssData",
    "ImuData",
    "IngestAdapter",
    "IngestError",
    "IngestIssue",
    "Manifest",
    "ParsedSession",
    "PedalData",
    "SyncMarkers",
    "VideoStream",
    "gap_stats",
    "get_adapters",
    "parse_session",
    "register_adapter",
    "verify_video_frames",
]
