"""웹 화면의 샘플 JSON이 생성기 정답과 일치하고 최신 상태인지 확인한다."""

import json
from pathlib import Path

import pytest

from psi_synth.export_web import SAMPLE_DT_MS, build_samples

ROOT = Path(__file__).resolve().parents[1]
SAMPLES_PATH = ROOT / "apps" / "web" / "src" / "lib" / "pedal-samples.json"


@pytest.fixture(scope="module")
def samples():
    return build_samples()


def test_committed_json_matches_generator(samples):
    committed = json.loads(SAMPLES_PATH.read_text(encoding="utf-8"))
    assert committed == json.loads(json.dumps(samples, ensure_ascii=False))


def test_all_event_types_are_present_with_unique_ids(samples):
    events = samples["events"]
    assert {event["type"] for event in events} == {"pedestrian", "lead_brake", "routine", "overlap", "hard_accel"}
    assert len({event["id"] for event in events}) == len(events)


def test_series_and_marks_are_consistent(samples):
    for event in samples["events"]:
        lengths = {len(values) for values in event["series"].values()}
        assert len(lengths) == 1
        span = (lengths.pop() - 1) * SAMPLE_DT_MS
        for mark in event["marks"]:
            assert 0 <= mark["ms"] <= span + SAMPLE_DT_MS, event["id"]


def test_hazard_metrics_derive_from_marks(samples):
    for event in samples["events"]:
        if event["type"] not in ("pedestrian", "lead_brake"):
            continue
        marks = {mark["key"]: mark["ms"] for mark in event["marks"]}
        metrics = event["metrics"]
        assert metrics["recognitionMs"] == marks["T1"] - marks["T0"]
        assert metrics["transitionMs"] == marks["T4"] - marks["T2"]
        assert metrics["totalReactionMs"] == marks["T4"] - marks["T0"]
        assert metrics["riseMs"] == marks["T5"] - marks["T4"]
        assert 0 <= event["score"] <= 100


def test_pressure_at_marks_matches_event_definition(samples):
    for event in samples["events"]:
        marks = {mark["key"]: mark["ms"] for mark in event["marks"]}
        series = event["series"]
        at = lambda name, ms: series[name][min(round(ms / SAMPLE_DT_MS), len(series[name]) - 1)]  # noqa: E731
        if "T4" in marks:
            assert at("brake", marks["T4"]) < 5.0, event["id"]
        if "T2" in marks:
            assert at("accel", marks["T2"]) <= 3.0, event["id"]
        if "T5" in marks:
            # 20ms 표본 사이에서 목표 압력을 지나야 한다. 급제동은 표본 하나에 수 %씩 오른다.
            before = series["brake"][marks["T5"] // SAMPLE_DT_MS]
            after = series["brake"][marks["T5"] // SAMPLE_DT_MS + 1]
            assert before - 0.1 <= 0.8 * event["stats"]["peakBrakePct"] <= after + 0.1, event["id"]
        if "O0" in marks:
            middle = (marks["O0"] + marks["O1"]) / 2
            assert at("accel", middle) > 5.0 and at("brake", middle) > 5.0, event["id"]


def test_usage_shares_sum_to_one_hundred(samples):
    assert sum(samples["usage"].values()) == pytest.approx(100.0, abs=0.2)


def test_histograms_cover_every_event(samples):
    transition_total = sum(item["value"] for item in samples["transitionHistogram"])
    assert transition_total == samples["scope"]["hazardEvents"]
    assert sum(item["value"] for item in samples["accelHistogram"]) == pytest.approx(100.0, abs=0.5)


def test_motion_thresholds_are_exported_and_match_event_examples(samples):
    thresholds = samples["thresholds"]
    assert thresholds == {"hardAccelG": 0.3, "hardBrakeG": -0.4}
    tagged_accels = []
    tagged_decels = []
    for event in samples["events"]:
        marks = sorted(mark["ms"] for mark in event["marks"])
        start = marks[0] // SAMPLE_DT_MS
        end = min(len(event["series"]["decelG"]), (marks[-1] + SAMPLE_DT_MS - 1) // SAMPLE_DT_MS + 1)
        event_values = event["series"]["decelG"][start:end]
        if max(event_values) >= thresholds["hardAccelG"]:
            tagged_accels.append(event)
        if min(event_values) <= thresholds["hardBrakeG"]:
            tagged_decels.append(event)

    assert [event["type"] for event in tagged_accels] == ["hard_accel"]
    assert tagged_decels
    assert all(event["type"] in {"pedestrian", "lead_brake"} for event in tagged_decels)


def test_mobile_review_keeps_visual_and_timeline_in_separate_scroll_regions():
    root = ROOT / "apps" / "web" / "src" / "components"
    workspace = (root / "MobileDriveWorkspace.tsx").read_text(encoding="utf-8")
    shell = (root / "AppShell.tsx").read_text(encoding="utf-8")
    assert 'grid-rows-[auto_auto_auto_minmax(0,1fr)]' in workspace
    assert 'timeline-scroll h-full min-h-0 overflow-y-auto overscroll-contain' in workspace
    assert 'h-[calc(100dvh-4rem)] min-h-0 overflow-hidden overscroll-none' in shell
    assert 'const normalizedPath = pathname.replace(/\\/$/, "") || "/";' in shell
    assert 'const isDriveReview = normalizedPath === "/events";' in shell
    assert "safe-area-inset-bottom" in shell


def test_score_explanation_uses_the_selected_period_instead_of_fixed_counts():
    component = (
        ROOT / "apps" / "web" / "src" / "components" / "ScoreExplanation.tsx"
    ).read_text(encoding="utf-8")
    assert "period.metrics" in component
    assert "급가속 3회" not in component
    assert "metrics.accel" in component
    assert "metrics.brake" in component


def test_dashboard_omits_duplicate_demo_and_device_sections():
    components = ROOT / "apps" / "web" / "src" / "components"
    dashboard = (components / "Dashboard.tsx").read_text(encoding="utf-8")
    shell = (components / "AppShell.tsx").read_text(encoding="utf-8")
    assert "Priority drive moment" not in dashboard
    assert "DeviceOverview" not in dashboard
    assert "이번 달 주행거리" not in shell
    assert "데이터 품질" not in shell


def test_profile_prioritizes_status_and_hides_technical_details():
    profile = (
        ROOT / "apps" / "web" / "src" / "components" / "ProfilePage.tsx"
    ).read_text(encoding="utf-8")
    assert "한눈에 보는 상태" in profile
    assert "데이터 상세 보기" in profile
    assert "바로가기" not in profile
    assert "Vehicle & Device" not in profile
    assert '<details className="group mt-2">' in profile
