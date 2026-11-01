"""빈 서비스 기동과 저장소 구성 점검. Docker 없이 돌 수 있는 범위만 확인한다."""

from pathlib import Path

import yaml
from fastapi.testclient import TestClient

from psi_api.main import app as api_app
from psi_synth.truth import load_thresholds
from psi_workers.celery_app import app as celery_app
from psi_workers.celery_app import ping

ROOT = Path(__file__).resolve().parents[1]


def test_api_health():
    response = TestClient(api_app).get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_worker_ping_task_runs_eagerly():
    celery_app.conf.task_always_eager = True
    try:
        assert ping.delay().get() == "pong"
    finally:
        celery_app.conf.task_always_eager = False


def test_scoring_config_is_valid():
    config = yaml.safe_load((ROOT / "config" / "scoring_config.v1.yaml").read_text(encoding="utf-8"))
    assert config["version"] == "v1"
    scoring = config["scoring"]
    assert sum(scoring["weights"].values()) == 100
    assert scoring["weights"] == {"responsiveness": 35, "braking_quality": 25, "pedal_safety": 25, "smoothness": 15}
    assert scoring["method"] in ("piecewise_linear", "cohort_percentile")
    for name, points in scoring["curves"].items():
        xs = [point[0] for point in points]
        assert xs == sorted(xs), name
        assert all(0 <= point[1] <= 100 for point in points), name
    assert scoring["curves"]["pedal_transition_ms"] == [[200, 100], [600, 0]]
    assert scoring["curves"]["total_brake_reaction_ms"] == [[700, 100], [1500, 0]]
    assert scoring["curves"]["pedal_overlap_count"] == [[0, 100], [4, 0]]


def test_truth_thresholds_come_from_config():
    th = load_thresholds()
    assert (th.on_pct, th.off_pct, th.debounce_ms) == (5.0, 2.0, 20)
    assert (th.t5_ratio, th.t6_decel_g) == (0.8, -0.1)
    assert th.config_version == "v1"


def test_compose_services_point_at_existing_build_files():
    compose = yaml.safe_load((ROOT / "docker-compose.yml").read_text(encoding="utf-8"))
    services = compose["services"]
    assert set(services) == {"postgres", "redis", "minio", "api", "worker", "web"}
    for name, service in services.items():
        if "build" in service:
            assert (ROOT / service["build"]["context"] / service["build"]["dockerfile"]).is_file(), name
