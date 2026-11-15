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


def test_sample_provenance_is_explicit_and_reproducible(samples):
    provenance = samples["provenance"]
    assert provenance["kind"] == "synthetic_ground_truth"
    assert provenance["sessionSeeds"] == [101, 201, 301, 102, 202, 302]
    assert provenance["sampleIntervalMs"] == SAMPLE_DT_MS
    assert provenance["displayPeriod"] == {
        "start": "2026-10-26",
        "end": "2026-11-01",
        "label": "2026.10.26–11.01",
        "note": "시연용 사건일 · 합성 세션 전체 · 날짜 필터 미적용",
    }
    assert samples["configVersion"] == "v1"
    assert samples["settings"] == {
        "pedalOnPct": 5.0,
        "pedalOffPct": 2.0,
        "debounceMs": 20,
        "brakeForceRatioPct": 80,
        "vehicleDecelStartG": -0.1,
        "videoSensorTargetMs": 33,
        "pedalImuTargetMs": 5,
        "maxFrameDropPct": 1.0,
        "recognitionFullScoreMs": 300,
        "recognitionZeroScoreMs": 1000,
        "transitionFullScoreMs": 200,
        "transitionZeroScoreMs": 600,
        "reactionFullScoreMs": 700,
        "reactionZeroScoreMs": 1500,
    }


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


def test_exported_graphs_do_not_show_unbraked_accel_rise_with_speed_drop(samples):
    """눈에 띄는 가속 입력 상승과 속도 하락이 같은 무제동 구간에 겹치지 않는다."""
    for event in samples["events"]:
        accel = event["series"]["accel"]
        brake = event["series"]["brake"]
        speed = event["series"]["speedKmh"]
        for window in (10, 20):  # 200ms, 400ms
            for end in range(window, len(accel)):
                start = end - window
                accel_rise = accel[end] - accel[start]
                speed_change = speed[end] - speed[start]
                if accel_rise >= 2.0 and max(brake[start : end + 1]) <= 2.0:
                    assert speed_change > -0.2, (event["id"], start, end)


def test_event_speed_direction_matches_the_displayed_scenario(samples):
    for event in samples["events"]:
        start = event["stats"]["speedStartKmh"]
        end = event["stats"]["speedEndKmh"]
        if event["type"] == "hard_accel":
            assert end > start
        elif event["type"] in {"pedestrian", "lead_brake", "routine", "overlap"}:
            assert end <= start


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
    assert "실제 계정·차량·기기는 아직 연결되지 않았습니다" in profile
    assert "최저 배터리" not in profile
    assert "센서 수집률" not in profile


def test_login_separates_account_sign_in_from_demo_access():
    login = (
        ROOT / "apps" / "web" / "src" / "components" / "LoginScreen.tsx"
    ).read_text(encoding="utf-8")
    assert "내 운전 데이터 확인하기" in login
    assert "데모 화면 둘러보기" in login
    assert "암호화 연결" in login
    assert "defaultValue=" not in login
    assert 'type={showPassword ? "text" : "password"}' in login
    assert "이번 주 점수" not in login
    assert "확인할 장면" not in login
    assert "주행 장면과 페달 동시 확인" not in login


def test_dashboard_only_shows_traceable_generated_metrics():
    dashboard = (
        ROOT / "apps" / "web" / "src" / "components" / "Dashboard.tsx"
    ).read_text(encoding="utf-8")
    icons = (
        ROOT / "apps" / "web" / "src" / "components" / "Icons.tsx"
    ).read_text(encoding="utf-8")
    assert 'aria-label="합성 분석 요약"' in dashboard
    assert "EvidenceDisclosure" not in dashboard
    assert 'href="/evidence"' not in dashboard
    assert "scope.hazardEvents" in dashboard
    assert "기간 추세가 아니라" in dashboard
    assert "Key moment" in dashboard
    assert "가장 길었던 페달 전환" in dashboard
    assert "devices.length" not in dashboard
    assert "scoreChange" not in dashboard
    assert "bg-[linear-gradient" not in icons
    assert "shadow-[inset" not in icons


def test_evidence_page_separates_results_settings_and_published_sources():
    component = (
        ROOT / "apps" / "web" / "src" / "components" / "EvidencePage.tsx"
    ).read_text(encoding="utf-8")
    route = ROOT / "apps" / "web" / "src" / "app" / "evidence" / "page.tsx"
    assert route.exists()
    assert "현재 화면의 합성 계산값" in component
    assert "PSI 내부 기준과 설계 목표" in component
    assert "외부 연구·표준의 참고 수치" in component
    assert "출처 원문" in component
    assert "nhtsa.gov" in component
    assert "highways.fhwa.dot.gov" in component
    assert "committee.iso.org" in component
    assert "개인 점수 기준으로 사용하지 않음" in component


def test_brand_logo_uses_the_provided_web_asset():
    icons = (
        ROOT / "apps" / "web" / "src" / "components" / "Icons.tsx"
    ).read_text(encoding="utf-8")
    logo = ROOT / "apps" / "web" / "public" / "brand" / "psi-studio-logo.png"
    assert logo.exists()
    assert logo.stat().st_size > 10_000
    assert 'maskImage: \'url("/brand/psi-studio-logo.png")\'' in icons
    assert 'aria-label="PSI Studio"' in icons
    assert "bg-white shadow" not in icons


def test_final_mobile_polish_keeps_labels_readable_and_loading_friendly():
    components = ROOT / "apps" / "web" / "src" / "components"
    workspace = (components / "MobileDriveWorkspace.tsx").read_text(encoding="utf-8")
    profile = (components / "ProfilePage.tsx").read_text(encoding="utf-8")
    events_page = (ROOT / "apps" / "web" / "src" / "app" / "events" / "page.tsx").read_text(encoding="utf-8")
    assert "text-[9px]" not in workspace
    assert "현재 설정" in profile
    assert "fallback={<EventsLoading />}" in events_page
    assert 'role="status"' in events_page


def test_longitudinal_acceleration_is_hidden_and_chart_marks_do_not_stack():
    components = ROOT / "apps" / "web" / "src" / "components"
    detail = (components / "EventDetail.tsx").read_text(encoding="utf-8")
    chart = (components / "TimeChart.tsx").read_text(encoding="utf-8")
    pedal = (ROOT / "apps" / "web" / "src" / "lib" / "pedal.ts").read_text(encoding="utf-8")
    rendered_copy = detail + pedal
    assert "종가속도" not in rendered_copy
    assert "중가속도" not in rendered_copy
    assert 'title="종가속도 (g)"' not in detail
    assert "labelPositions" in chart
    assert "labelRows" not in chart
    assert "MARK_LABEL_WIDTH" in chart


def test_primary_driving_views_use_progressive_disclosure_and_show_dates():
    components = ROOT / "apps" / "web" / "src" / "components"
    dashboard = (components / "Dashboard.tsx").read_text(encoding="utf-8")
    habits = (components / "PedalHabits.tsx").read_text(encoding="utf-8")
    events = (components / "EventsExplorer.tsx").read_text(encoding="utf-8")
    detail = (components / "EventDetail.tsx").read_text(encoding="utf-8")

    assert "점수 계산식" not in dashboard
    assert "Driving score" in dashboard
    assert "provenance.displayPeriod.label" in dashboard
    assert "사건별 점수 그래프 보기" in dashboard
    assert "<details" in dashboard

    assert "한눈에 해석" in habits
    assert "상세 그래프 보기" in habits
    assert "그래프 기준 날짜" in habits
    assert 'role="note"' in habits
    assert "<details" in habits

    assert "pedalSamples.provenance.displayPeriod.label" in events
    assert "그래프 해석" in detail
    assert "상세 분석 보기" in detail
    assert "event.date" in detail
    assert "<details" in detail
    assert "그래프 기준 날짜" in detail
    assert "페달 압력은 운전자의 입력이고 속도는 차량의 반응" in detail
