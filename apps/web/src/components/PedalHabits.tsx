"use client";

import Link from "next/link";
import { Histogram } from "@/components/Histogram";
import { ChevronIcon } from "@/components/Icons";
import { ChartLegend, LineChart, type Series } from "@/components/LineChart";
import { SegmentBar, type Segment } from "@/components/SegmentBar";
import { PageHeader, Panel, PanelHeader, SampleBadge } from "@/components/ui";
import { ACCEL_COLOR, BRAKE_COLOR, formatMs, pedalSamples } from "@/lib/pedal";

const NEUTRAL = "#94A3B8";

function GraphScope() {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-[#d7e5f8] bg-[#f4f8fe] px-3 py-2" role="note" aria-label={`그래프 기준 날짜 ${pedalSamples.provenance.displayPeriod.label}`}>
      <span className="text-[10px] font-extrabold tracking-[.08em] text-brand uppercase">그래프 기준 날짜</span>
      <strong className="text-xs tabular-nums text-ink">{pedalSamples.provenance.displayPeriod.label}</strong>
      <span className="text-[11px] text-muted">시연용 사건일 · 합성 세션 전체</span>
    </div>
  );
}

function Insight({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 border-t border-line pt-3 text-sm leading-relaxed">{children}</p>;
}

export function PedalHabits() {
  const { provenance, scope, averages, usage, accelHistogram, brakePeakHistogram, transitionHistogram, brakeCurve, events } = pedalSamples;
  const usageSegments: Segment[] = [
    { key: "accel", label: "가속 페달", value: usage.accel, color: ACCEL_COLOR, onColor: "#FFFFFF" },
    { key: "coast", label: "페달 없음", value: usage.coast, color: NEUTRAL, onColor: "#10223F" },
    { key: "brake", label: "브레이크", value: usage.brake, color: BRAKE_COLOR, onColor: "#FFFFFF" },
    { key: "both", label: "두 페달 동시", value: usage.both, color: "#7C3AED", onColor: "#FFFFFF" },
  ];
  const reactionSegments: Segment[] = [
    { key: "recognition", label: "상황 확인 → 가속 해제", note: "T0–T1", value: averages.recognitionMs, color: "#2563EB", onColor: "#FFFFFF" },
    { key: "release", label: "가속 완전 해제", note: "T1–T2", value: averages.releaseMs, color: "#14A98A", onColor: "#10223F" },
    { key: "transition", label: "페달 전환", note: "T2–T4", value: averages.transitionMs, color: "#E8863A", onColor: "#10223F" },
    { key: "rise", label: "제동력 80% 도달", note: "T4–T5", value: averages.riseMs, color: "#8B5CF6", onColor: "#FFFFFF" },
  ];
  const curveLabels = brakeCurve.hazard.map((_, index) => `${index * brakeCurve.stepMs}ms`);
  const curveSeries: Series[] = [
    { name: "주의 장면 평균", values: brakeCurve.hazard, color: BRAKE_COLOR, emphasized: true },
    { name: "일상 감속 평균", values: brakeCurve.routine, color: NEUTRAL },
  ];
  const at250 = Math.round(250 / brakeCurve.stepMs);
  const topAccel = accelHistogram.reduce((best, bin) => (bin.value > best.value ? bin : best));
  const strongAccel = accelHistogram.filter((bin) => ["40–60", "60–100"].includes(bin.label)).reduce((sum, bin) => sum + bin.value, 0);
  const brakeTotal = brakePeakHistogram.reduce((sum, bin) => sum + bin.value, 0);
  const strongBrakes = brakePeakHistogram.slice(3).reduce((sum, bin) => sum + bin.value, 0);
  const gentleBrakes = brakePeakHistogram.slice(0, 2).reduce((sum, bin) => sum + bin.value, 0);
  const transitionTotal = transitionHistogram.reduce((sum, bin) => sum + bin.value, 0);
  const slowTransitions = transitionHistogram.slice(3).reduce((sum, bin) => sum + bin.value, 0);
  const hazards = events.filter((event) => event.score !== null);
  const slowest = hazards.reduce((best, event) => ((event.metrics.transitionMs ?? 0) > (best.metrics.transitionMs ?? 0) ? event : best));
  const overlapEvent = events.find((event) => event.type === "overlap");
  const hardestBrake = hazards.reduce((best, event) => event.stats.peakDecelG > best.stats.peakDecelG ? event : best);

  return (
    <>
      <PageHeader title="운전 습관" description={`${provenance.displayPeriod.label} 시연용 기록 전체를 요약했습니다. 핵심 해석만 먼저 보고, 그래프는 필요할 때 펼쳐보세요.`} action={<SampleBadge />} />

      <section className="grid gap-3 md:grid-cols-3" aria-label="운전 습관 핵심 장면">
        <Link href={`/events?id=${slowest.id}`} className="group rounded-2xl border border-[#f0dfc8] bg-[#fffaf3] p-4 transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none">
          <div className="flex items-center justify-between"><span className="rounded-full bg-caution-soft px-2 py-1 text-[10px] font-bold text-caution">가장 긴 전환</span><ChevronIcon className="size-4 text-caution" /></div>
          <p className="mt-3 text-2xl font-extrabold tabular-nums">{formatMs(slowest.metrics.transitionMs ?? 0)}</p>
          <p className="mt-1 text-[11px] text-muted">평균 {formatMs(averages.transitionMs)} · 애니메이션 보기</p>
        </Link>
        <Link href={`/events?id=${hardestBrake.id}`} className="group rounded-2xl border border-[#f3d9df] bg-[#fff8fa] p-4 transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none">
          <div className="flex items-center justify-between"><span className="rounded-full bg-[#feecef] px-2 py-1 text-[10px] font-bold text-alert">가장 강한 감속</span><ChevronIcon className="size-4 text-alert" /></div>
          <p className="mt-3 text-2xl font-extrabold tabular-nums">{hardestBrake.stats.peakDecelG.toFixed(2)}g</p>
          <p className="mt-1 text-[11px] text-muted">최대 제동 {Math.round(hardestBrake.stats.peakBrakePct)}% · 과정 보기</p>
        </Link>
        {overlapEvent && <Link href={`/events?id=${overlapEvent.id}`} className="group rounded-2xl border border-[#e7def7] bg-[#faf8ff] p-4 transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none">
          <div className="flex items-center justify-between"><span className="rounded-full bg-[#f1eafe] px-2 py-1 text-[10px] font-bold text-[#6d28d9]">페달 중첩</span><ChevronIcon className="size-4 text-[#6d28d9]" /></div>
          <p className="mt-3 text-2xl font-extrabold tabular-nums">{formatMs(overlapEvent.metrics.overlapMs ?? 0)}</p>
          <p className="mt-1 text-[11px] text-muted">두 페달 압력과 발 위치 보기</p>
        </Link>}
      </section>

      <Panel>
        <PanelHeader title="한눈에 해석" description={`${scope.drivingMinutes}분의 합성 주행과 주의 장면 ${scope.hazardEvents}개에서 확인된 값입니다.`} />
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-track p-4"><p className="text-xs font-bold text-brand">가속</p><p className="mt-2 text-sm leading-relaxed"><b>{topAccel.label}%</b> 압력을 가장 오래 사용했습니다({topAccel.value.toFixed(0)}%). 40% 이상 입력은 {strongAccel.toFixed(1)}%입니다.</p></div>
          <div className="rounded-xl bg-track p-4"><p className="text-xs font-bold text-brand">제동</p><p className="mt-2 text-sm leading-relaxed">총 {brakeTotal}회 중 <b>{strongBrakes}회</b>가 60% 이상, {gentleBrakes}회가 40% 이하였습니다.</p></div>
          <div className="rounded-xl bg-track p-4"><p className="text-xs font-bold text-brand">페달 전환</p><p className="mt-2 text-sm leading-relaxed">평균 <b>{formatMs(averages.transitionMs)}</b>, {transitionTotal}건 중 {slowTransitions}건이 400ms를 넘었습니다.</p></div>
        </div>
      </Panel>

      <details className="group rounded-2xl border border-line bg-card shadow-[0_12px_32px_rgba(15,31,54,.04)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 marker:hidden sm:p-6">
          <div><h2 className="font-extrabold">상세 그래프 보기</h2><p className="mt-1 text-xs text-muted">{provenance.displayPeriod.label} · 압력 분포, 제동 곡선, 반응 단계</p></div>
          <span className="rounded-full bg-track px-3 py-2 text-xs font-bold text-brand group-open:hidden">펼치기</span><span className="hidden rounded-full bg-track px-3 py-2 text-xs font-bold text-brand group-open:inline">접기</span>
        </summary>
        <div className="space-y-5 border-t border-line p-5 sm:p-6">
          <Panel><PanelHeader title="페달 사용 구성" description="차량이 움직이는 동안의 페달 사용 시간 비중입니다." /><GraphScope /><SegmentBar segments={usageSegments} unit="%" ariaLabel="페달 사용 시간 구성" /></Panel>
          <div className="grid gap-5 xl:grid-cols-2">
            <Panel><PanelHeader title="가속 페달 압력 분포" description="가속 페달을 밟고 있던 시간을 압력 구간별로 나눴습니다." /><GraphScope /><Histogram bins={accelHistogram} color={ACCEL_COLOR} valueSuffix="%" xTitle="가속 페달 압력 (%)" ariaLabel="가속 페달 압력 분포" /><Insight>가장 긴 구간은 <b>{topAccel.label}%</b>입니다.</Insight></Panel>
            <Panel><PanelHeader title="브레이크 압력 분포" description="제동마다 도달한 최대 압력을 구간별로 셌습니다." /><GraphScope /><Histogram bins={brakePeakHistogram} color={BRAKE_COLOR} valueSuffix="회" xTitle="제동당 최대 압력 (%)" ariaLabel="제동별 최대 압력 분포" /><Insight>60% 이상 강한 제동은 <b>{strongBrakes}회</b>입니다.</Insight></Panel>
          </div>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Panel><PanelHeader title="브레이크 압력 변화" description="브레이크 접촉 시점을 0으로 맞춘 평균 곡선입니다." action={<ChartLegend series={curveSeries} />} /><GraphScope /><LineChart labels={curveLabels} series={curveSeries} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} labelEvery={10} unit="%" height={230} ariaLabel={`브레이크 접촉 후 250ms 시점 압력: 주의 장면 ${brakeCurve.hazard[at250]}%, 일상 감속 ${brakeCurve.routine[at250]}%`} /><Insight>접촉 250ms 뒤 평균 압력은 주의 장면 <b>{Math.round(brakeCurve.hazard[at250])}%</b>, 일상 감속 {Math.round(brakeCurve.routine[at250])}%입니다.</Insight></Panel>
            <Panel><PanelHeader title="페달 전환 시간 분포" description="가속 해제부터 브레이크 접촉까지 걸린 시간입니다." /><GraphScope /><Histogram bins={transitionHistogram} color="#E8863A" valueSuffix="건" xTitle="페달 전환 시간 (ms)" ariaLabel="페달 전환 시간 분포" /><Insight>{transitionTotal}건 중 <b>{slowTransitions}건</b>이 400ms를 넘었습니다. <Link href={`/events?id=${slowest.id}`} className="font-medium text-brand underline underline-offset-2">가장 긴 장면 애니메이션 보기</Link></Insight></Panel>
          </div>
          <Panel><PanelHeader title="주의 장면의 평균 반응 단계" description={`상황 확인부터 브레이크 접촉까지 평균 ${formatMs(averages.totalReactionMs)}입니다.`} /><GraphScope /><SegmentBar segments={reactionSegments} unit="ms" ariaLabel="주의 장면 반응 시간 구성" /><p className="mt-3 text-xs text-muted">T0는 전방 영상에서 표시한 시점이므로 약 ±17ms의 불확실성이 있습니다.</p></Panel>
        </div>
      </details>
    </>
  );
}
