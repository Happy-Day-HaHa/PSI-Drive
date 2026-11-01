"""입력 포맷 어댑터 레지스트리."""

import zipfile
from pathlib import Path
from typing import Protocol

from psi_signal.ingest.models import IngestError, ParsedSession


class IngestAdapter(Protocol):
    format_id: str

    def can_read(self, archive: zipfile.ZipFile) -> bool: ...

    def parse(self, archive: zipfile.ZipFile, source: Path) -> ParsedSession: ...


_ADAPTERS: list[IngestAdapter] = []


def register_adapter(adapter: IngestAdapter) -> None:
    if any(existing.format_id == adapter.format_id for existing in _ADAPTERS):
        raise ValueError(f"adapter already registered: {adapter.format_id}")
    _ADAPTERS.append(adapter)


def get_adapters() -> tuple[IngestAdapter, ...]:
    return tuple(_ADAPTERS)


def parse_session(path: str | Path) -> ParsedSession:
    """세션 ZIP을 읽어 맞는 어댑터로 파싱한다. 영상은 풀지 않고 CSV와 매니페스트만 읽는다."""
    source = Path(path)
    try:
        archive = zipfile.ZipFile(source)
    except (zipfile.BadZipFile, FileNotFoundError) as error:
        raise IngestError(f"cannot open session package {source}: {error}") from error
    with archive:
        for adapter in _ADAPTERS:
            if adapter.can_read(archive):
                return adapter.parse(archive, source)
    raise IngestError(f"no adapter can read {source}")
