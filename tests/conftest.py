import pytest

from psi_synth import Injection, SynthParams, simulate_session, write_session

VIDEO_SCALE = 0.1


@pytest.fixture(scope="session")
def packaged(tmp_path_factory):
    """결함을 골고루 주입한 저해상도 세션 ZIP. 왕복 테스트 전체가 공유한다."""
    params = SynthParams(
        scenario="pedestrian",
        seed=7,
        n_events=2,
        overlap_count=1,
        injection=Injection(frame_drop_rate=0.005, sensor_gap_count=2, pedal_zero_bias_counts=15),
    )
    session = simulate_session(params)
    zip_path, truth_path = write_session(session, tmp_path_factory.mktemp("session"), VIDEO_SCALE)
    return session, zip_path, truth_path
