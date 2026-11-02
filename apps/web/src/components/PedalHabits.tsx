"use client";

import Link from "next/link";
import { Histogram } from "@/components/Histogram";
import { ChevronIcon } from "@/components/Icons";
import { ChartLegend, LineChart, type Series } from "@/components/LineChart";
import { SegmentBar, type Segment } from "@/components/SegmentBar";
import { PageHeader, Panel, PanelHeader, SampleBadge, Stat } from "@/components/ui";
import { ACCEL_COLOR, BRAKE_COLOR, eventTypeLabels, formatMs, pedalSamples } from "@/lib/pedal";

const NEUTRAL = "#94A3B8";

function Insight({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 border-t border-line pt-3 text-sm leading-relaxed">{children}</p>;
}

export function PedalHabits() {
  const { scope, averages, usage, accelHistogram, brakePeakHistogram, transitionHistogram, brakeCurve, transitionFullScoreMs, transitionZeroScoreMs, events } = pedalSamples;

  const usageSegments: Segment[] = [
    { key: "accel", label: "가속 페달", value: usage.accel, color: ACCEL_COLOR, onColor: "#FFFFFF" },
    { key: "coast", label: "타력 주행 (페달 없음)", value: usage.coast, color: NEUTRAL, onColor: "#10223F" },
    { key: "brake", label: "브레이크", value: usage.brake, color: BRAKE_COLOR, onColor: "#FFFFFF" },
    { key: "both", label: "두 페달 동시", value: usage.both, color: "#7C3AED", onColor: "#FFFFFF" },
  ];
  const reactionSegments: Segment[] = [
    { key: "recognition", label: "상황 확인 → 가속 해제 시작", note: "T0–T1", value: averages.recognitionMs, color: "#2563EB", onColor: "#FFFFFF" },
    { key: "release", label: "가속 페달 완전 해제", note: "T1–T2", value: averages.releaseMs, color: "#14A98A", onColor: "#10223F" },
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
      <PageHeader
        title="운전 습관"
        description={`압력 센서 기록으로 페달을 얼마나 부드럽고 빠르게 조작하는지 살펴봅니다. 주행 ${scope.drivingMinutes}분, 주의 장면 ${scope.hazardEvents}개 기준입니다.`}
        action={<SampleBadge />}
      />

      <section className="grid gap-3 md:grid-cols-3" aria-label="운전 습관 분석 시작점">
        <Link href={`/events?id=${slowest.id}`} className="group rounded-2xl border border-[#f0dfc8] bg-[#fffaf3] p-4 transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,31,54,.07)] motion-reduce:transform-none">
          <div className="flex items-center justify-between"><span className="rounded-full bg-caution-soft px-2 py-1 text-[10px] font-bold text-caution">먼저 확인</span><ChevronIcon className="size-4 text-caution transition group-hover:translate-x-0.5" /></div>
          <p className="mt-3 text-xs font-semibold text-muted">가장 길었던 페달 전환</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">{formatMs(slowest.metrics.transitionMs ?? 0)}</p>
          <p className="mt-1 text-[11px] text-muted">평균 {formatMs(averages.transitionMs)} · 발 이동 과정 재생</p>
        </Link>
        <Link href={`/events?id=${hardestBrake.id}`} className="group rounded-2xl border border-[#f3d9df] bg-[#fff8fa] p-4 transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,31,54,.07)] motion-reduce:transform-none">
          <div className="flex items-center justify-between"><span className="rounded-full bg-[#feecef] px-2 py-1 text-[10px] font-bold text-alert">강한 제동</span><ChevronIcon className="size-4 text-alert transition group-hover:translate-x-0.5" /></div>
          <p className="mt-3 text-xs font-semibold text-muted">가장 큰 감속</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">{hardestBrake.stats.peakDecelG.toFixed(2)}g</p>
          <p className="mt-1 text-[11px] text-muted">최대 제동 {Math.round(hardestBrake.stats.peakBrakePct)}% · 압력 변화 확인</p>
        </Link>
        {overlapEvent ? (
          <Link href={`/events?id=${overlapEvent.id}`} className="group rounded-2xl border border-[#e7def7] bg-[#faf8ff] p-4 transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,31,54,.07)] motion-reduce:transform-none">
            <div className="flex items-center justify-between"><span className="rounded-full bg-[#f1eafe] px-2 py-1 text-[10px] font-bold text-[#6d28d9]">페달 중첩</span><ChevronIcon className="size-4 text-[#6d28d9] transition group-hover:translate-x-0.5" /></div>
            <p className="mt-3 text-xs font-semibold text-muted">두 페달을 함께 밟은 시간</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">{formatMs(overlapEvent.metrics.overlapMs ?? 0)}</p>
            <p className="mt-1 text-[11px] text-muted">발 위치와 두 압력을 동시에 확인</p>
          </Link>
        ) : (
          <div className="rounded-2xl border border-[#d8eadf] bg-[#f4faf6] p-4"><span className="rounded-full bg-good-soft px-2 py-1 text-[10px] font-bold text-good">양호</span><p className="mt-3 text-sm font-bold">페달 중첩이 없어요</p><p className="mt-1 text-[11px] text-muted">현재 분석 범위에서 두 페달 동시 입력이 감지되지 않았습니다.</p></div>
        )}
      </section>

      <Panel>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4 lg:divide-x lg:divide-line [&>div]:lg:pl-6 [&>div:first-child]:lg:pl-0">
          <div><Stat label="평균 가속 압력" value={`${averages.accelPct}`} unit="%" note={`변동계수 ${averages.accelCv}`} /></div>
          <div><Stat label="평균 최대 제동 압력" value={`${averages.peakBrakePct}`} unit="%" note={`제동 ${brakeTotal}회 기준`} /></div>
          <div><Stat label="평균 페달 전환" value={`${averages.transitionMs}`} unit="ms" note="가속 해제 → 브레이크 접촉" /></div>
          <div><Stat label="평균 제동력 상승" value={`${averages.riseMs}`} unit="ms" note="브레이크 접촉 → 80% 도달" /></div>
        </dl>
      </Panel>

      <Panel>
        <PanelHeader title="페달 사용 구성" description="차량이 움직이는 동안 어떤 페달을 어떻게 사용했는지 시간 비중으로 나타냅니다." />
        <SegmentBar segments={usageSegments} unit="%" ariaLabel="페달 사용 시간 구성" />
      </Panel>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel id="accel-pattern">
          <PanelHeader title="가속 페달을 밟는 세기" description="가속 페달을 밟고 있던 시간이 압력 구간별로 어떻게 나뉘는지 보여 줍니다." />
          <Histogram bins={accelHistogram} color={ACCEL_COLOR} valueSuffix="%" xTitle="가속 페달 압력 (%)" ariaLabel="가속 페달 압력 분포" />
          <Insight>
            주로 <b>{topAccel.label}%</b> 압력으로 주행합니다({topAccel.value.toFixed(0)}%의 시간). 40% 이상의 강한 입력은 {strongAccel.toFixed(1)}%에 그칩니다.
          </Insight>
        </Panel>
        <Panel>
          <PanelHeader title="브레이크를 밟는 세기" description="제동 한 번마다 도달한 최대 압력을 구간별로 셉니다." />
          <Histogram bins={brakePeakHistogram} color={BRAKE_COLOR} valueSuffix="회" xTitle="제동당 최대 압력 (%)" ariaLabel="제동별 최대 압력 분포" />
          <Insight>
            제동 {brakeTotal}회 중 <b>{strongBrakes}회</b>가 60% 이상의 강한 제동이고, {gentleBrakes}회는 40% 이하의 부드러운 제동입니다.
          </Insight>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel>
          <PanelHeader
            title="브레이크를 밟는 방식"
            description="브레이크에 닿은 순간을 0으로 맞춰 압력이 오르는 모양을 비교합니다."
            action={<ChartLegend series={curveSeries} />}
          />
          <LineChart
            labels={curveLabels}
            series={curveSeries}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            labelEvery={10}
            unit="%"
            height={230}
            ariaLabel={`브레이크 접촉 후 250ms 시점 압력: 주의 장면 ${brakeCurve.hazard[at250]}%, 일상 감속 ${brakeCurve.routine[at250]}%`}
          />
          <Insight>
            접촉 후 250ms 시점의 평균 압력은 주의 장면에서 <b>{Math.round(brakeCurve.hazard[at250])}%</b>, 일상 감속에서 <b>{Math.round(brakeCurve.routine[at250])}%</b>입니다. 상황에 따라 제동 강도를 구분해 사용하고 있습니다.
          </Insight>
        </Panel>
        <Panel>
          <PanelHeader title="페달 전환 시간" description="가속 페달에서 발을 떼고 브레이크에 닿기까지 걸린 시간입니다." />
          <Histogram bins={transitionHistogram} color="#E8863A" valueSuffix="건" xTitle="페달 전환 시간 (ms)" ariaLabel="페달 전환 시간 분포" />
          <Insight>
            점수 기준은 {transitionFullScoreMs}ms 이하 만점, {transitionZeroScoreMs}ms 이상 0점입니다. {transitionTotal}건 중 {slowTransitions}건이 400ms를 넘었습니다.{" "}
            <Link href={`/events?id=${slowest.id}`} className="font-medium whitespace-nowrap text-brand underline underline-offset-2">
              전환이 길었던 장면 보기 ({eventTypeLabels[slowest.type]}, {formatMs(slowest.metrics.transitionMs ?? 0)})
            </Link>
          </Insight>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="주의 장면의 평균 반응" description={`주의 장면 ${scope.hazardEvents}개의 평균입니다. 상황 확인부터 브레이크 접촉까지 평균 ${formatMs(averages.totalReactionMs)}가 걸렸습니다.`} />
        <SegmentBar segments={reactionSegments} unit="ms" ariaLabel="주의 장면 반응 시간 구성" />
        <p className="mt-3 text-xs text-muted">T0는 전방 영상에서 표시한 시점이므로 약 ±17ms의 불확실성이 있습니다.</p>
      </Panel>

      <section className="rounded-2xl border border-[#d7e5f8] bg-[linear-gradient(135deg,#f8fbff,#edf4ff)] p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[11px] font-bold tracking-[.13em] text-brand uppercase">Next drive guide</p><h2 className="mt-1 text-xl font-extrabold">다음 주행에서 한 가지만 바꿔보세요</h2><p className="mt-1 text-xs text-muted">현재 샘플 범위에서 확인 가능한 조작 패턴을 바탕으로 제안합니다.</p></div>
          <span className="rounded-full border border-[#c6d9f4] bg-white px-3 py-1.5 text-[11px] font-bold text-brand">주행 후 다시 비교</span>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <article className="rounded-xl bg-white p-4 shadow-[0_8px_22px_rgba(15,31,54,.045)]">
            <div className="flex items-start gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-caution text-xs font-extrabold text-white">1</span><div><h3 className="text-sm font-bold">발 이동을 조금 일찍 시작하기</h3><p className="mt-1 text-xs leading-relaxed text-muted">가속 페달을 완전히 뗀 뒤 뒤꿈치를 축으로 브레이크 쪽으로 이동해 보세요. 다음 기록에서 전환 시간 변화를 비교할 수 있어요.</p><Link href={`/events?id=${slowest.id}`} className="mt-3 inline-flex items-center gap-0.5 text-xs font-bold text-brand">현재 장면 다시 보기<ChevronIcon className="size-3" /></Link></div></div>
          </article>
          <article className="rounded-xl bg-white p-4 shadow-[0_8px_22px_rgba(15,31,54,.045)]">
            <div className="flex items-start gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-data text-xs font-extrabold text-white">2</span><div><h3 className="text-sm font-bold">브레이크 전에 먼저 가속 해제하기</h3><p className="mt-1 text-xs leading-relaxed text-muted">앞차의 속도 변화를 일찍 확인하고 가속 입력을 먼저 줄이면 강한 제동 압력을 낮추는 데 도움이 됩니다.</p><Link href={`/events?id=${hardestBrake.id}`} className="mt-3 inline-flex items-center gap-0.5 text-xs font-bold text-brand">강한 제동 과정 보기<ChevronIcon className="size-3" /></Link></div></div>
          </article>
        </div>
      </section>
    </>
  );
}
