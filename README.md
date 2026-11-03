# PSI 스튜디오

차량 후장착 키트(전방·풋웰 카메라, 페달 압력센서, GNSS/IMU)의 기록을 하나의 시간축으로 맞춰, 페달 조작을 밀리초 단위로 분석하고 점수화하는 웹 SaaS입니다.

> 점수는 운전 행동 지표이며, 사고 원인이나 법적 과실을 판정하지 않습니다.

## 진행 상황

- [x] 저장소 구조, Docker Compose, 설계 문서, 점수 설정 v1
- [x] Phase 1: 합성 데이터 생성기 + 파서
- [x] 화면 시안: 대시보드, 페달 습관, 주행 기록 돌아보기 (샘플·합성 데이터)
- [ ] Phase 2: 동기화 엔진
- [ ] Phase 3~7: 이벤트 검출, 점수, 파이프라인, 세션 분석 화면, 멀티테넌시

문서: [요구사항](CLAUDE.md) · [아키텍처](docs/ARCHITECTURE.md) · [가정 기록](docs/ASSUMPTIONS.md)

## 개발 환경

Python 3.11 이상이 필요합니다.

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m pytest
```

macOS의 Python 3.13에서 `No module named 'psi_synth'` 오류가 나면 editable 설치 파일의 숨김 플래그를 지웁니다. `pytest`는 이 문제의 영향을 받지 않습니다.

```bash
chflags nohidden .venv/lib/python3.13/site-packages/*.pth
```

## 합성 세션 생성

```bash
.venv/bin/python -m psi_synth --scenario pedestrian --seed 1 --out out/
```

세션 ZIP과 정답 JSON(`*.truth.json`)이 함께 만들어집니다. 자주 쓰는 옵션은 다음과 같습니다.

| 옵션 | 설명 |
|---|---|
| `--scenario` | `pedestrian`, `lead_brake`, `normal` |
| `--events N`, `--overlaps N`, `--harsh-accels N` | 사건, 페달 중첩, 급가속 횟수 |
| `--video-scale 0.1` | 저해상도로 빠르게 생성 |
| `--max-offset-ms`, `--max-drift-ppm` | 클록 오차 범위 (기본 ±300ms, ±50ppm) |
| `--frame-drop 0.01`, `--sensor-gaps N` | 프레임 드롭률, 센서 결측 구간 수 |
| `--omit-marker pps`, `--no-sync-gesture`, `--gnss-outage 10 5` | 망가진 세션 만들기 |

## 세션 파싱

```python
from psi_signal.ingest import parse_session

session = parse_session("out/session_PSI-KIT-0001_20260601T000000Z.zip")
session.pedal.device_ts_us  # int64 µs
session.issues              # 결측, 마커 누락 등 품질 문제
```

## 웹 화면

Node.js 22가 필요합니다.

```bash
cd apps/web
npm ci
npm run dev   # http://localhost:3000
```

첫 화면은 데모 로그인 페이지이며, 미리 입력된 계정으로 로그인하면 /dashboard에서 운전 점수와 차량·기기 상태를 확인할 수 있습니다. 현재 로그인은 정적 화면 흐름을 검증하기 위한 데모이며 실제 인증 서버와는 아직 연결되지 않았습니다.

## 배포

`main`에 푸시하면 Cloudflare Pages가 자동으로 빌드해 https://psi-drive.pages.dev 에 배포합니다.

| Pages 설정 | 값 |
|---|---|
| 루트 디렉터리 | `apps/web` |
| 빌드 명령 | `npm run build:pages` |
| 출력 디렉터리 | `out` |

정적 배포라 지금은 웹 화면만 올라갑니다. API와 워커는 별도 호스팅이 필요합니다.

## 전체 서비스 실행

```bash
docker compose up --build
```

| 서비스 | 주소 |
|---|---|
| 웹 | http://localhost:3000 |
| API | http://localhost:8000/health |
| MinIO 콘솔 | http://localhost:9001 |
| PostgreSQL + TimescaleDB | localhost:5432 |
| Redis | localhost:6379 |

기본 비밀번호는 로컬 개발용입니다. 바꾸려면 `.env.example`을 `.env`로 복사해 수정합니다.
