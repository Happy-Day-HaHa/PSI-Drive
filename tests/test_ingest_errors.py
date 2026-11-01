"""잘못된 패키지 처리와 어댑터 확장."""

import json
import zipfile

import pytest

from psi_signal.ingest import IngestError, get_adapters, parse_session, register_adapter
from psi_signal.ingest.adapters import _ADAPTERS
from psi_signal.ingest.models import ParsedSession


def rewrite(source, target, *, drop=(), replace=None):
    """source ZIP을 복사하면서 일부 멤버를 빼거나 바꾼다."""
    replace = replace or {}
    with zipfile.ZipFile(source) as src, zipfile.ZipFile(target, "w") as dst:
        for name in src.namelist():
            if name in drop:
                continue
            dst.writestr(name, replace.get(name, src.read(name)))
    return target


def member(source, name):
    with zipfile.ZipFile(source) as archive:
        return archive.read(name)


@pytest.mark.parametrize(
    "name", ["front.mp4", "foot_frames.csv", "pedal.csv", "imu.csv", "gnss.csv", "sync_markers.csv"]
)
def test_missing_member_is_fatal(packaged, tmp_path, name):
    _, zip_path, _ = packaged
    broken = rewrite(zip_path, tmp_path / "broken.zip", drop=[name])
    with pytest.raises(IngestError, match=name):
        parse_session(broken)


def test_missing_manifest_has_no_adapter(packaged, tmp_path):
    _, zip_path, _ = packaged
    broken = rewrite(zip_path, tmp_path / "broken.zip", drop=["manifest.json"])
    with pytest.raises(IngestError, match="no adapter"):
        parse_session(broken)


def test_unknown_format_has_no_adapter(packaged, tmp_path):
    _, zip_path, _ = packaged
    manifest = json.loads(member(zip_path, "manifest.json"))
    manifest["format"] = "vendor-x"
    broken = rewrite(zip_path, tmp_path / "broken.zip", replace={"manifest.json": json.dumps(manifest)})
    with pytest.raises(IngestError, match="no adapter"):
        parse_session(broken)


def test_not_a_zip_and_missing_file(tmp_path):
    bad = tmp_path / "bad.zip"
    bad.write_bytes(b"not a zip")
    with pytest.raises(IngestError):
        parse_session(bad)
    with pytest.raises(IngestError):
        parse_session(tmp_path / "absent.zip")


def test_missing_column_is_fatal(packaged, tmp_path):
    _, zip_path, _ = packaged
    broken = rewrite(zip_path, tmp_path / "broken.zip", replace={"pedal.csv": "device_ts_us,accel_raw\n1,2\n"})
    with pytest.raises(IngestError, match="brake_raw"):
        parse_session(broken)


def test_float_timestamp_is_rejected(packaged, tmp_path):
    """시간 값은 부동소수로 받지 않는다."""
    _, zip_path, _ = packaged
    csv = "device_ts_us,accel_raw,brake_raw\n1.5,2,3\n2.5,2,3\n"
    broken = rewrite(zip_path, tmp_path / "broken.zip", replace={"pedal.csv": csv})
    with pytest.raises(IngestError, match="pedal.csv"):
        parse_session(broken)


def test_invalid_calibration_is_fatal(packaged, tmp_path):
    _, zip_path, _ = packaged
    manifest = json.loads(member(zip_path, "manifest.json"))
    manifest["calibration"]["brake"]["full_scale_raw"] = 0
    broken = rewrite(zip_path, tmp_path / "broken.zip", replace={"manifest.json": json.dumps(manifest)})
    with pytest.raises(IngestError, match="brake"):
        parse_session(broken)


def test_non_monotonic_and_out_of_range_become_issues(packaged, tmp_path):
    _, zip_path, _ = packaged
    csv = "device_ts_us,accel_raw,brake_raw\n3000,10,20\n1000,9999,20\n"
    broken = rewrite(zip_path, tmp_path / "broken.zip", replace={"pedal.csv": csv})
    codes = parse_session(broken).issue_codes()
    assert "non_monotonic_timestamps" in codes
    assert "adc_out_of_range" in codes


def test_missing_sync_markers_become_issue(packaged, tmp_path):
    _, zip_path, _ = packaged
    broken = rewrite(
        zip_path, tmp_path / "broken.zip", replace={"sync_markers.csv": "device_ts_us,marker_type,stream,seq\n"}
    )
    assert "sync_marker_missing" in parse_session(broken).issue_codes()


def test_new_firmware_format_only_needs_an_adapter(packaged, tmp_path):
    _, zip_path, _ = packaged

    class VendorAdapter:
        format_id = "vendor-x"

        def can_read(self, archive):
            return "vendor.bin" in archive.namelist()

        def parse(self, archive, source):
            parsed = parse_session(zip_path)
            assert isinstance(parsed, ParsedSession)
            return parsed

    vendor = tmp_path / "vendor.zip"
    with zipfile.ZipFile(vendor, "w") as archive:
        archive.writestr("vendor.bin", b"\x00")

    adapter = VendorAdapter()
    register_adapter(adapter)
    try:
        assert adapter in get_adapters()
        assert parse_session(vendor).manifest.format == "psi-ingest-v1"
        with pytest.raises(ValueError):
            register_adapter(VendorAdapter())
    finally:
        _ADAPTERS.remove(adapter)
