"use client";

import Link from "next/link";
import { Histogram } from "@/components/Histogram";
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
    { key: "recognition", label: "위험 인지 → 가속 해제 시작", note: "T0–T1", value: averages.recognitionMs, color: "#2563EB", onColor: "#FFFFFF" },
    { key: "release", label: "가속 페달 완전 해제", note: "T1–T2", value: averages.releaseMs, color: "#14A98A", onColor: "#10223F" },
    { key: "transition", label: "페달 전환", note: "T2–T4", value: averages.transitionMs, color: "#E8863A", onColor: "#10223F" },
    { key: "rise", label: "제동력 80% 도달", note: "T4–T5", value: averages.riseMs, color: "#8B5CF6", onColor: "#FFFFFF" },
  ];

  const curveLabels = brakeCurve.hazard.map((_, index) => `${index * brakeCurve.stepMs}ms`);
  const curveSeries: Series[] = [
    { name: "위험 사건 평균", values: brakeCurve.hazard, color: BRAKE_COLOR, emphasized: true },
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

  return (
    <>
      <PageHeader
        title="페달 습관"
        description={`압력 센서 기록으로 페달을 얼마나 세게, 얼마나 빠르게 밟는지 분석합니다. 합성 세션 ${scope.sessions}개, 주행 ${scope.drivingMinutes}분, 위험 사건 ${scope.hazardEvents}건 기준입니다.`}
        action={<SampleBadge />}
      />

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
        <Panel>
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
            ariaLabel={`브레이크 접촉 후 250ms 시점 압력: 위험 사건 ${brakeCurve.hazard[at250]}%, 일상 감속 ${brakeCurve.routine[at250]}%`}
          />
          <Insight>
            접촉 후 250ms 시점의 평균 압력은 위험 사건에서 <b>{Math.round(brakeCurve.hazard[at250])}%</b>, 일상 감속에서 <b>{Math.round(brakeCurve.routine[at250])}%</b>입니다. 상황에 따라 제동 강도를 구분해 사용하고 있습니다.
          </Insight>
        </Panel>
        <Panel>
          <PanelHeader title="페달 전환 시간" description="가속 페달에서 발을 떼고 브레이크에 닿기까지 걸린 시간입니다." />
          <Histogram bins={transitionHistogram} color="#E8863A" valueSuffix="건" xTitle="페달 전환 시간 (ms)" ariaLabel="페달 전환 시간 분포" />
          <Insight>
            점수 기준은 {transitionFullScoreMs}ms 이하 만점, {transitionZeroScoreMs}ms 이상 0점입니다. {transitionTotal}건 중 {slowTransitions}건이 400ms를 넘었습니다.{" "}
            <Link href={`/events?id=${slowest.id}`} className="font-medium whitespace-nowrap text-brand underline underline-offset-2">
              가장 느린 사건 보기 ({eventTypeLabels[slowest.type]}, {formatMs(slowest.metrics.transitionMs ?? 0)})
            </Link>
          </Insight>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="위험 상황 평균 반응 구성" description={`위험 사건 ${scope.hazardEvents}건의 평균입니다. 위험 인지부터 브레이크 접촉까지 평균 ${formatMs(averages.totalReactionMs)}가 걸렸습니다.`} />
        <SegmentBar segments={reactionSegments} unit="ms" ariaLabel="위험 상황 반응 시간 구성" />
        <p className="mt-3 text-xs text-muted">T0는 전방 영상에서 표시한 시점이므로 약 ±17ms의 불확실성이 있습니다.</p>
      </Panel>
    </>
  );
}
