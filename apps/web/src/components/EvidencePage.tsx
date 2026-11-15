import { PageHeader, SampleBadge } from "@/components/ui";
import { pedalSamples } from "@/lib/pedal";

type Row = {
  label: string;
  value: string;
  basis: string;
  source?: number;
  status: "계산값" | "내부 설정" | "외부 참고값";
};

const sources = [
  {
    id: 1,
    organization: "NHTSA",
    title: "Human Factors Design Guidance for Driver-Vehicle Interfaces",
    url: "https://www.nhtsa.gov/sites/nhtsa.gov/files/documents/812360_humanfactorsdesignguidance.pdf",
    note: "반응시간은 기대 여부, 연령, 주의 부하, 피로와 환경에 따라 달라 하나의 절대값으로 정하기 어렵다고 설명합니다.",
  },
  {
    id: 2,
    organization: "NHTSA",
    title: "Human Factors Insights for Collision Warning System Interfaces",
    url: "https://www.nhtsa.gov/sites/nhtsa.gov/files/cws_hf_insights_task_5_final_rpt.pdf",
    note: "기대·비기대·돌발 상황별 제동 반응시간 연구값을 정리한 보고서입니다.",
  },
  {
    id: 3,
    organization: "NHTSA",
    title: "Development of an FCW Algorithm Evaluation Methodology",
    url: "https://www.nhtsa.gov/sites/nhtsa.gov/files/dot20hs2081120145.pdf",
    note: "실도로 장애물 대응 연구의 평균, 표준편차와 백분위 반응시간을 정리합니다.",
  },
  {
    id: 4,
    organization: "FHWA",
    title: "Speed Concepts: Engineering and Technical Concepts",
    url: "https://highways.fhwa.dot.gov/safety/speed-management/speed-concepts-informational-guide/chapter-4-engineering-and-technical",
    note: "정지시거 설계에 사용하는 반응시간과 감속도 가정입니다. 개인 운전자 판정 기준은 아닙니다.",
  },
  {
    id: 5,
    organization: "NHTSA",
    title: "Age Versus Experience: Video Feedback Intervention for Newly Licensed Teen Drivers",
    url: "https://www.nhtsa.gov/sites/nhtsa.gov/files/documents/812508.pdf",
    note: "자연주행 영상 수집에 사용된 종방향 가속도 트리거와 선행 연구의 강한 제동 기준을 설명합니다.",
  },
  {
    id: 6,
    organization: "ISO",
    title: "ISO 15623:2013 — Forward Vehicle Collision Warning Systems",
    url: "https://committee.iso.org/standard/56655.html?browse=tc",
    note: "전방 차량 충돌경고 시스템의 성능 요구사항과 시험 절차를 다루는 국제표준입니다.",
  },
] as const;

const externalRows: Row[] = [
  { label: "위험을 예상한 운전자의 제동 반응", value: "중앙값 약 0.60–0.65초", basis: "위험 발생을 충분히 예상한 조건", source: 2, status: "외부 참고값" },
  { label: "비기대·일상적 위험의 제동 반응", value: "중앙값 약 1.15초", basis: "선행차 제동등처럼 예상하지 못했지만 흔한 상황", source: 2, status: "외부 참고값" },
  { label: "완전한 돌발 상황의 제동 반응", value: "중앙값 약 1.40초", basis: "운전자가 놀라는 돌발 상황", source: 2, status: "외부 참고값" },
  { label: "실도로 장애물 대응 연구", value: "평균 1.50초 · 표준편차 0.40초 · 85백분위 1.90초", basis: "측정 가능한 제동 반응을 보인 운전자 56명", source: 3, status: "외부 참고값" },
  { label: "정지시거 설계 반응시간", value: "2.50초", basis: "대부분 운전자를 포괄하기 위한 도로 설계값; 개인 점수 기준으로 사용하지 않음", source: 4, status: "외부 참고값" },
  { label: "정지시거 설계 감속도", value: "0.35g", basis: "도로 기하구조 설계 가정; 급제동 판정값이 아님", source: 4, status: "외부 참고값" },
  { label: "자연주행 영상 트리거", value: "종방향 ±0.45g", basis: "DriveCam 연구에서 사건 영상을 저장하기 위한 장치 트리거", source: 5, status: "외부 참고값" },
  { label: "선행 자연주행 연구의 강한 제동", value: "−0.50g", basis: "100-car 연구에서 강한 제동 사건을 찾는 데 사용한 기준", source: 5, status: "외부 참고값" },
];

const sourceBadge = (source?: number) => source ? <a href={`#source-${source}`} className="font-bold text-brand underline decoration-brand/30 underline-offset-2">[{source}]</a> : null;

function DataTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line/90 bg-white shadow-[0_8px_24px_rgba(15,31,54,.04)]">
      <div className="hidden grid-cols-[minmax(160px,1fr)_minmax(180px,.8fr)_minmax(260px,1.4fr)_100px] gap-4 border-b border-line bg-canvas px-5 py-3 text-[11px] font-bold text-muted md:grid">
        <span>항목</span><span>수치</span><span>산출·적용 조건</span><span>구분</span>
      </div>
      <div className="divide-y divide-line/80">
        {rows.map((row) => (
          <article key={`${row.label}-${row.value}`} className="grid gap-2 px-5 py-4 md:grid-cols-[minmax(160px,1fr)_minmax(180px,.8fr)_minmax(260px,1.4fr)_100px] md:items-start md:gap-4">
            <h3 className="text-sm font-bold">{row.label} {sourceBadge(row.source)}</h3>
            <p className="font-bold tabular-nums text-brand">{row.value}</p>
            <p className="text-xs leading-relaxed text-muted">{row.basis}</p>
            <span className={`w-fit rounded-full px-2 py-1 text-[10px] font-bold ${row.status === "외부 참고값" ? "bg-[#eef4fb] text-brand" : row.status === "내부 설정" ? "bg-caution-soft text-caution" : "bg-good-soft text-good"}`}>{row.status}</span>
          </article>
        ))}
      </div>
    </div>
  );
}

export function EvidencePage() {
  const { source, configVersion, provenance, scope, averages, usage, thresholds, settings } = pedalSamples;
  const measuredRows: Row[] = [
    { label: "합성 세션", value: `${scope.sessions}개`, basis: `고정 시드 ${provenance.sessionSeeds.join(", ")}로 생성`, status: "계산값" },
    { label: "합성 주행 범위", value: `${scope.distanceKm}km · ${scope.drivingMinutes}분`, basis: "합성 속도 적분 거리와 세션 전체 지속시간 합계", status: "계산값" },
    { label: "주의 장면", value: `${scope.hazardEvents}건`, basis: "합성 시나리오의 T0–T7 정답 마커가 있는 사건 수", status: "계산값" },
    { label: "급가속·급감속", value: `${scope.hardAccels}건 · ${scope.hardBrakes}건`, basis: `IMU 합성 신호가 각각 +${thresholds.hardAccelG}g, ${thresholds.hardBrakeG}g 기준을 넘은 구간`, status: "계산값" },
    { label: "평균 인지-해제", value: `${averages.recognitionMs}ms`, basis: "주의 장면별 T1 − T0의 산술평균", status: "계산값" },
    { label: "평균 가속 완전 해제", value: `${averages.releaseMs}ms`, basis: "주의 장면별 T2 − T1의 산술평균", status: "계산값" },
    { label: "평균 페달 전환", value: `${averages.transitionMs}ms`, basis: "주의 장면별 T4 − T2의 산술평균", status: "계산값" },
    { label: "평균 총 제동 반응", value: `${averages.totalReactionMs}ms`, basis: "주의 장면별 T4 − T0의 산술평균", status: "계산값" },
    { label: "평균 제동력 상승", value: `${averages.riseMs}ms`, basis: "주의 장면별 T5 − T4의 산술평균", status: "계산값" },
    { label: "평균 차량 반응 지연", value: `${averages.vehicleDelayMs}ms`, basis: "주의 장면별 T6 − T4의 산술평균", status: "계산값" },
    { label: "평균 가속 압력·변동계수", value: `${averages.accelPct}% · ${averages.accelCv}`, basis: "가속 페달 ON 표본의 평균과 표준편차/평균", status: "계산값" },
    { label: "평균 최대 제동 압력", value: `${averages.peakBrakePct}%`, basis: "제동 사건별 최대 압력의 산술평균", status: "계산값" },
    { label: "페달 사용 시간", value: `가속 ${usage.accel}% · 타력 ${usage.coast}% · 제동 ${usage.brake}% · 동시 ${usage.both}%`, basis: "차량 이동 중 각 페달 상태의 시간 비율", status: "계산값" },
  ];
  const settingRows: Row[] = [
    { label: "페달 ON/OFF", value: `${settings.pedalOnPct}% / ${settings.pedalOffPct}%`, basis: `히스테리시스 판정 · ${settings.debounceMs}ms 지속 조건 · 설정 ${configVersion}`, status: "내부 설정" },
    { label: "제동력 도달 마커 T5", value: `사건 최대 압력의 ${settings.brakeForceRatioPct}%`, basis: "제동력 상승 시간을 계산하기 위한 제품 정의", status: "내부 설정" },
    { label: "차량 감속 시작 T6", value: `${settings.vehicleDecelStartG}g 이하`, basis: "IMU에서 차량 감속 시작을 표시하는 제품 정의", status: "내부 설정" },
    { label: "급가속·급감속 후보", value: `+${thresholds.hardAccelG}g / ${thresholds.hardBrakeG}g`, basis: "외부 참고값과 별개인 PSI 초기 후보 탐지 기준", status: "내부 설정" },
    { label: "인지–가속 해제 점수 곡선", value: `${settings.recognitionFullScoreMs}ms 이하 100점 · ${settings.recognitionZeroScoreMs}ms 이상 0점`, basis: "두 값 사이는 선형 환산 · 파일럿 검증 전 초기 곡선", status: "내부 설정" },
    { label: "페달 전환 점수 곡선", value: `${settings.transitionFullScoreMs}ms 이하 100점 · ${settings.transitionZeroScoreMs}ms 이상 0점`, basis: "두 값 사이는 선형 환산 · 파일럿 검증 전 초기 곡선", status: "내부 설정" },
    { label: "총 제동 반응 점수 곡선", value: `${settings.reactionFullScoreMs}ms 이하 100점 · ${settings.reactionZeroScoreMs}ms 이상 0점`, basis: "두 값 사이는 선형 환산 · 파일럿 검증 전 초기 곡선", status: "내부 설정" },
    { label: "최종 반응 점수", value: "(인지 점수 + 전환 점수 + 총 반응 점수) ÷ 3", basis: "세 구성 점수에 같은 비중을 둔 산술평균 · 파일럿 검증 전 제품 정의", status: "내부 설정" },
    { label: "영상–센서 동기화 목표", value: `${settings.videoSensorTargetMs}ms 이하`, basis: "실측 결과가 아니라 시스템 설계 목표", status: "내부 설정" },
    { label: "페달–IMU 동기화 목표", value: `${settings.pedalImuTargetMs}ms 이하`, basis: "실측 결과가 아니라 시스템 설계 목표", status: "내부 설정" },
    { label: "영상 프레임 결측 목표", value: `${settings.maxFrameDropPct}% 미만`, basis: "실측 결과가 아니라 수집 품질 설계 목표", status: "내부 설정" },
    { label: "30fps 영상 시점 불확실성", value: `약 ±17ms`, basis: "한 프레임 33.3ms의 절반으로 계산한 이론적 양자화 불확실성", status: "내부 설정" },
  ];

  return (
    <>
      <PageHeader title="수치 기준·출처" description={`${provenance.displayPeriod.label} 시연용 기록에 쓰인 계산값, PSI 내부 설정값, 외부 연구 참고값을 서로 섞지 않고 공개합니다.`} action={<SampleBadge />} />
      <div className="rounded-xl border border-[#f0dfc8] bg-[#fffaf3] px-4 py-3 text-xs leading-relaxed text-muted"><b className="text-ink">읽는 방법:</b> 계산값은 합성 데이터에서 재현할 수 있는 결과입니다. 내부 설정은 아직 파일럿 검증 전 제품 정의입니다. 외부 참고값은 연구 조건이 달라 PSI 점수 경계로 직접 사용하지 않습니다.</div>

      <section className="space-y-3"><div><p className="text-[11px] font-bold tracking-[.13em] text-brand uppercase">Generated results</p><h2 className="mt-1 text-xl font-extrabold">현재 화면의 합성 계산값</h2><p className="mt-1 text-xs text-muted">원본: {source} · 생성 간격 {provenance.sampleIntervalMs}ms · 설정 {configVersion}</p></div><DataTable rows={measuredRows} /></section>
      <section className="space-y-3"><div><p className="text-[11px] font-bold tracking-[.13em] text-caution uppercase">Product settings</p><h2 className="mt-1 text-xl font-extrabold">PSI 내부 기준과 설계 목표</h2><p className="mt-1 text-xs text-muted">외부 공인 기준이 아닌 값은 모두 내부 설정으로 표시했습니다.</p></div><DataTable rows={settingRows} /></section>
      <section className="space-y-3"><div><p className="text-[11px] font-bold tracking-[.13em] text-brand uppercase">Published references</p><h2 className="mt-1 text-xl font-extrabold">외부 연구·표준의 참고 수치</h2><p className="mt-1 text-xs text-muted">상황과 연구 정의가 다르므로 단순 서열화나 안전 판정에 사용하지 않습니다.</p></div><DataTable rows={externalRows} /></section>

      <section id="sources" className="scroll-mt-24 rounded-2xl border border-line/90 bg-white p-5 shadow-[0_8px_24px_rgba(15,31,54,.04)] sm:p-6">
        <h2 className="text-xl font-extrabold">출처 원문</h2>
        <p className="mt-1 text-xs text-muted">기관명과 문서 제목을 누르면 공식 원문으로 이동합니다. 확인일: 2026년 11월 15일.</p>
        <ol className="mt-4 divide-y divide-line/80">
          {sources.map((item) => (
            <li id={`source-${item.id}`} key={item.id} className="scroll-mt-24 py-4 first:pt-0 last:pb-0">
              <div className="flex gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#eef4fb] text-xs font-extrabold text-brand">{item.id}</span><div><a href={item.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-brand underline decoration-brand/25 underline-offset-2">{item.organization} · {item.title}</a><p className="mt-1 text-xs leading-relaxed text-muted">{item.note}</p></div></div>
            </li>
          ))}
        </ol>
      </section>

      <p className="text-xs leading-relaxed text-muted">외부 참고값은 문헌의 연구 결과를 요약한 것이며, PSI의 효능·안전성 또는 사고 감소 효과를 주장하는 근거가 아닙니다. 자체 실증이 완료되면 연구 설계, 표본 수, 신뢰구간과 검증 결과를 이 페이지에 추가해야 합니다.</p>
    </>
  );
}
