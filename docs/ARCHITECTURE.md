# PSI Studio 아키텍처

제품 요구사항 전체는 저장소 루트의 [CLAUDE.md](../CLAUDE.md)에 있다. 이 문서는 현재 구조와 구현 결정만 다룬다.

## 저장소 구조

| 경로 | 역할 | 상태 |
|---|---|---|
| `apps/web` | PSI Studio 프론트엔드 (Next.js, TypeScript, Tailwind) | 대시보드 화면 시안, 샘플 데이터 사용 |
| `apps/api` | API (FastAPI) | `/health`만 있음 |
| `workers/` | 비동기 처리 워커 (Celery + Redis) | `psi.ping` 태스크만 있음 |
| `packages/signal` | 신호 처리 라이브러리 `psi_signal` | Ingest 파서 구현 완료 |
| `tools/synth` | 합성 세션 생성기 `psi_synth` | 구현 완료 |
| `config/` | 버전이 붙은 점수·검출 설정 | v1 |
| `tests/` | Python 테스트 | Phase 1 기준 |

표준 라이브러리 `signal`과 충돌하지 않도록 `packages/signal`의 import 이름은 `psi_signal`이다.

## 데이터 흐름

Phase 5에서 아래 파이프라인을 잇는다. 굵게 표시한 단계가 현재 구현돼 있다.

```
장비 또는 psi_synth
  → 세션 ZIP 업로드
  → **파싱·검증 (psi_signal.ingest)**
  → 동기화 (Phase 2)
  → 1kHz 리샘플 (Phase 2)
  → 이벤트 검출·지표 (Phase 3)
  → 점수 (Phase 4)
  → PSI Studio
```

## 시간 표현

- 내부 표준은 정수 µs(`int64`)다. CSV의 시간 열이 소수면 파서가 거부한다.
- 스트림 클록과 UTC의 관계는 `master_ts = device_ts × (1 + drift) + offset`이다.
- 클록은 `front`, `foot`, `pedal`, `motion` 4개다. IMU와 GNSS는 같은 모듈이라 `motion`을 공유한다.

## Ingest Format v1

사양서 2.1절의 구조를 따르며, 사양서에 없던 다음 항목을 정했다.

**manifest.json**
- `format`: `"psi-ingest-v1"`. 어댑터 선택에 쓴다.
- `start_utc_us`, `calibration`, `streams` 외 장비·차량·운전자 ID를 담는다.
- `calibration.accel|brake`: `zero_raw`, `full_scale_raw`.
- `calibration.sync.led_after_tap_us`: 브레이크 탭 후 LED가 켜지기까지의 고정 지연.
- `streams[]`: `name`, `kind`, `file`, `clock`, 공칭 주기(`nominal_fps` 또는 `nominal_hz`). 영상은 `frames_file`을 추가로 갖는다.

**sync_markers.csv**: `device_ts_us, marker_type, stream, seq`

사양서의 두 열에 `stream`, `seq`를 더했다. 스트림마다 클록이 달라 `device_ts_us`만으로는 어느 클록의 값인지 알 수 없기 때문이다.

| marker_type | stream | device_ts_us 의미 | seq |
|---|---|---|---|
| `pps` | front, foot, pedal, motion | 해당 클록에서 잰 PPS 펄스 시각 | 공유 펄스 카운터. 같은 seq는 같은 펄스 |
| `brake_tap` | pedal | 탭 onset | 0 |
| `led_flash` | front, foot | 플래시가 처음 보이는 프레임의 타임스탬프 | 0 |
| `stationary` | motion | 정지 상태 확인 시각 | 0 |

**frames.csv**: `frame_idx`는 mp4 안에서의 프레임 위치이며 0부터 끊김 없이 증가한다. 드롭은 `device_ts_us` 간격으로 찾는다.

**gnss.csv**: fix가 없는 행은 `fix_quality = 0`이고 `utc_us`, `lat`, `lon`, `speed_mps`가 비어 있다.

## 파서 (`psi_signal.ingest`)

- `parse_session(path)`가 등록된 어댑터 중 읽을 수 있는 것을 고른다. 새 펌웨어 포맷은 `IngestAdapter`를 구현해 `register_adapter`로 등록한다.
- 오류는 두 단계로 나뉜다.
  - `IngestError`(치명적): 파일·열 누락, 잘못된 형식, 소수 타임스탬프, 잘못된 캘리브레이션.
  - `ParsedSession.issues`(계속 처리): 비단조 타임스탬프, 샘플 결측, ADC 범위 초과, GNSS fix 없음, 동기화 마커 누락. Phase 2의 Sync Report가 이를 판정에 반영한다.
- 영상은 파싱 때 풀지 않는다. mp4 프레임 수 대조는 ffmpeg가 필요한 별도 단계 `verify_video_frames`다.
- ZIP 안에서 정해진 이름만 읽고 임의 경로로 풀지 않는다. 업로드 크기 제한과 압축 폭탄 방어는 업로드 경로가 생기는 Phase 5에서 넣는다.

## 합성 생성기 (`psi_synth`)

| 모듈 | 역할 |
|---|---|
| `driving` | 시나리오별 페달·발 궤적과 차량 응답을 1kHz로 시뮬레이션 |
| `clocks` | 클록별 오프셋·드리프트 |
| `session` | 센서 샘플링, 결함 주입, 테이블과 정답 생성 (영상 제외, 메모리 내) |
| `render` | 도형과 LED 패치로 H.264 영상 렌더링 |
| `package` | 세션 ZIP과 정답 JSON 저장 |
| `truth` | 정답 임계값 로딩과 ON 구간 계산 |

- 시나리오는 `pedestrian`(완전 정지), `lead_brake`(감속 후 해제), `normal`(위험 사건 없음)이다.
- `simulate_session`은 영상 없이 돌아 빠르다. Phase 2의 100세션 검증에 그대로 쓸 수 있다.
- 정답 JSON은 ZIP 밖의 `<세션명>.truth.json`에 저장해 파서가 볼 수 없다.
- 정답 임계값은 `config/scoring_config.v1.yaml`을 읽는다. 생성기와 검출기가 같은 설정을 기준으로 삼게 하기 위해서다.
- 같은 seed와 파라미터는 같은 CSV, 매니페스트, 정답을 만든다. 렌더링된 mp4의 바이트 동일성은 보장하지 않는다.

## 웹 화면 (PSI 스튜디오)

`apps/web`은 정적으로 내보낼 수 있는 세 페이지로 구성한다. 사양서 6.1의 영상 동기 재생은 Phase 6에서 구현한다.

| 경로 | 내용 | 데이터 |
|---|---|---|
| `/` 대시보드 | 종합·세부 점수, 추이, 주요 지표, 페달 조작 요약, 확인 필요 항목, 최근 사건·운전 기록 | 점수와 기록은 `sample-data.ts`, 페달 항목은 합성 데이터 |
| `/pedal` 페달 습관 | 페달 사용 구성, 가속·제동 압력 분포, 평균 제동 곡선, 페달 전환 분포, 평균 반응 구성 | 합성 데이터 |
| `/events` 사건 분석 | 사건 목록과 상세: 압력·속도·종가속도 그래프, T0~T7, 발 위치 재생, 단계 설명, 평균 비교 | 합성 데이터 |

- 합성 데이터 파일 `src/lib/pedal-samples.json`은 다음 명령으로 만든다. 손으로 고치지 않으며, `tests/test_web_samples.py`가 생성기 결과와 일치하는지 검사한다.

  ```bash
  PYTHONPATH=packages/signal/src:tools/synth/src .venv/bin/python -m psi_synth.export_web --out apps/web/src/lib/pedal-samples.json
  ```
- 그래프 값은 잡음 없는 시뮬레이션 신호이며 검출 알고리즘(Phase 3)의 결과가 아니다. Phase 3 이후에는 API가 같은 구조로 실측 값을 내려 주는 형태로 바꾼다.
- 사건의 "반응 지표"는 인지-해제, 페달 전환, 총 제동 반응을 v1 곡선으로 환산한 평균이다. 사건 단위 점수 산식은 Phase 4에서 확정한다.
- 가속 페달은 파랑, 브레이크는 빨강으로 고정한다. UI 강조색은 데이터 색과 겹치지 않도록 네이비를 쓴다.
- 차트는 라이브러리 없이 SVG로 그렸다. 세션 전체의 수십만 포인트 차트는 사양서대로 uPlot이나 ECharts를 쓴다.
- Pretendard 글꼴은 jsDelivr에서 불러오고, 실패하면 시스템 글꼴을 쓴다.
