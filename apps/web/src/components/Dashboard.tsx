"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronIcon } from "@/components/Icons";
import { ChartLegend, LineChart, type Series } from "@/components/LineChart";
import { RadarChart } from "@/components/RadarChart";
import { ScoreRing } from "@/components/ScoreRing";
import { SegmentBar, type Segment } from "@/components/SegmentBar";
import { PageHeader, Panel, PanelHeader, SampleBadge } from "@/components/ui";
import { ACCEL_COLOR, BRAKE_COLOR, eventAlerts, eventTypeLabels, formatMs, pedalSamples, type PedalEvent } from "@/lib/pedal";
import {
  habitTips,
  overallScore,
  periodOrder,
  periods,
  scoreBand,
  trips,
  weekly,
  type HabitKey,
  type Metric,
  type PeriodKey,
} from "@/lib/sample-data";

const SCORE_LINE = "var(--color-data)";
const COMPARE = "var(--color-compare)";

function MetricCell({ metric, compareLabel }: { metric: Metric; compareLabel: string }) {
  const isGood = metric.lowerIsBetter === null ? null : metric.lowerIsBetter === metric.changePct < 0;
  const tone = isGood === null || metric.changePct === 0 ? "text-muted" : isGood ? "text-good" : "text-alert";
  const change = metric.changePct === 0 ? "변화 없음" : `${metric.changePct < 0 ? "↓" : "↑"} ${Math.abs(metric.changePct)}%`;
  return (
    <div className="min-w-0 px-5 py-4">
      <dt className="text-[13px] text-muted">{metric.label}</dt>
      <dd className="mt-1 text-[22px] leading-tight font-bold tracking-tight">
        {metric.value}
        <span className="ml-0.5 text-[13px] font-medium text-muted">{metric.unit}</span>
      </dd>
      <dd className={`mt-0.5 text-xs font-medium ${tone}`} title={`${compareLabel} 대비`}>
        {change}
      </dd>
    </div>
  );
}

function ScorePill({ score }: { score: number }) {
  const tone = score >= 80 ? "bg-good-soft text-good" : "bg-caution-soft text-caution";
  return <span className={`inline-block rounded px-2 py-0.5 text-[13px] font-bold tabular-nums ${tone}`}>{score}</span>;
}

function eventFigure(event: PedalEvent) {
  if (event.type === "overlap") return `중첩 ${formatMs(event.metrics.overlapMs ?? 0)}`;
  if (event.type === "routine") return `타력 ${((event.metrics.coastMs ?? 0) / 1000).toFixed(1)}초`;
  return `전환 ${formatMs(event.metrics.transitionMs ?? 0)}`;
}

export function Dashboard() {
  const [periodKey, setPeriodKey] = useState<PeriodKey>("30d");
  const [habit, setHabit] = useState<HabitKey | null>(null);
  const period = periods[periodKey];
  const score = overallScore(period.subScores);
  const { averages, usage, events } = pedalSamples;
  const alerts = eventAlerts();

  const trendSeries: Series[] = [
    { name: period.currentName, values: period.trendCurrent, color: SCORE_LINE, emphasized: true },
    { name: period.previousName, values: period.trendPrevious, color: COMPARE },
  ];
  const weeklySeries: Series[] = [
    { name: "이번 주", values: weekly.current, color: SCORE_LINE, emphasized: true },
    { name: "지난주", values: weekly.previous, color: COMPARE },
  ];
  const usageSegments: Segment[] = [
    { key: "accel", label: "가속 페달", value: usage.accel, color: ACCEL_COLOR, onColor: "#FFFFFF" },
    { key: "coast", label: "타력 주행", value: usage.coast, color: "#94A3B8", onColor: "#10223F" },
    { key: "brake", label: "브레이크", value: usage.brake, color: BRAKE_COLOR, onColor: "#FFFFFF" },
    { key: "both", label: "두 페달 동시", value: usage.both, color: "#7C3AED", onColor: "#FFFFFF" },
  ];

  const ranked = [...period.habits].sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const weakest = ranked[ranked.length - 1];
  const selectedHabit = period.habits.find((item) => item.key === habit);

  return (
    <>
      <PageHeader
        title="대시보드"
        description="운전 습관 점수와 페달 조작 요약을 한눈에 확인합니다."
        action={
          <div className="flex items-center gap-2">
            <SampleBadge />
            <label className="flex items-center gap-2 rounded-md border border-line bg-card px-3 py-1.5 text-sm font-medium focus-within:outline-2 focus-within:outline-brand">
              <span className="text-muted">조회 기간</span>
              <select value={periodKey} onChange={(event) => setPeriodKey(event.target.value as PeriodKey)} className="cursor-pointer bg-transparent outline-none">
                {periodOrder.map((key) => (
                  <option key={key} value={key}>
                    {periods[key].label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        }
      />

      <Panel>
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[auto_minmax(0,1fr)]">
            <div className="mx-auto">
              <ScoreRing score={score} />
              <p className="mt-3 text-center text-sm font-semibold">{scoreBand(score)}</p>
              <p className="mt-0.5 text-center text-xs font-medium text-good">
                {period.compareLabel} 대비 +{period.scoreChange}점
              </p>
            </div>
            <ul className="min-w-0 space-y-3.5">
              {period.subScores.map((item) => (
                <li key={item.key}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold">
                      {item.label} <span className="ml-0.5 text-xs font-normal text-muted">비중 {item.weight}%</span>
                    </span>
                    <span className="text-sm font-bold tabular-nums">{item.score}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-track" aria-hidden>
                    <div className="h-full rounded-full bg-brand transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${item.score}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted">{item.description}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0 border-line xl:border-l xl:pl-8">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold">{period.trendTitle}</h2>
              <ChartLegend series={trendSeries} />
            </div>
            <LineChart
              labels={period.trendLabels}
              series={trendSeries}
              height={210}
              ariaLabel={`${period.trendTitle}. ${period.currentName} 마지막 점수 ${period.trendCurrent[period.trendCurrent.length - 1]}점`}
            />
          </div>
        </div>
      </Panel>

      <section aria-label="주요 운전 지표" className="rounded-xl border border-line bg-card">
        <dl className="grid grid-cols-2 divide-line sm:grid-cols-3 xl:grid-cols-6 xl:divide-x">
          {period.metrics.map((metric) => (
            <MetricCell key={metric.key} metric={metric} compareLabel={period.compareLabel} />
          ))}
        </dl>
        <p className="border-t border-line px-5 py-2 text-xs text-muted">증감은 {period.compareLabel} 대비입니다.</p>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel>
          <PanelHeader
            title="페달 조작 요약"
            description="차량이 움직이는 동안의 페달 사용 비중입니다."
            action={
              <Link href="/pedal" className="inline-flex items-center gap-0.5 text-[13px] font-medium text-brand hover:underline">
                페달 습관 보기
                <ChevronIcon className="size-3.5" />
              </Link>
            }
          />
          <SegmentBar segments={usageSegments} unit="%" ariaLabel="페달 사용 시간 구성" />
          <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-center">
            <div>
              <dt className="text-xs text-muted">평균 페달 전환</dt>
              <dd className="mt-0.5 font-bold tabular-nums">{formatMs(averages.transitionMs)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">평균 제동력 상승</dt>
              <dd className="mt-0.5 font-bold tabular-nums">{formatMs(averages.riseMs)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">평균 최대 제동</dt>
              <dd className="mt-0.5 font-bold tabular-nums">{averages.peakBrakePct}%</dd>
            </div>
          </dl>
        </Panel>

        <Panel>
          <PanelHeader title="확인이 필요한 항목" description="항목을 누르면 해당 사건의 압력 기록으로 이동합니다." />
          <ul className="divide-y divide-line">
            {alerts.map((alert) => (
              <li key={alert.title}>
                <Link href={`/events?id=${alert.event.id}`} className="group flex items-start gap-3 py-3 first:pt-0">
                  <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${alert.severity === "alert" ? "bg-alert" : "bg-caution"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="text-sm font-semibold group-hover:underline">{alert.title}</span>
                      <span className="text-xs text-muted">
                        {alert.event.date} {alert.event.time}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">{alert.body}</span>
                  </span>
                  <ChevronIcon className="mt-1 size-4 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="최근 사건"
          description="사건을 누르면 페달을 어떻게 밟았는지 단계별로 확인할 수 있습니다."
          action={
            <Link href="/events" className="inline-flex items-center gap-0.5 text-[13px] font-medium text-brand hover:underline">
              전체 보기
              <ChevronIcon className="size-3.5" />
            </Link>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th scope="col" className="py-2 pr-4 font-medium">유형</th>
                <th scope="col" className="py-2 pr-4 font-medium">일시</th>
                <th scope="col" className="py-2 pr-4 font-medium">주요 지표</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">최대 제동</th>
                <th scope="col" className="py-2 text-right font-medium">반응 지표</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 5).map((event) => (
                <tr key={event.id} className="border-b border-line last:border-b-0 hover:bg-canvas">
                  <td className="py-2.5 pr-4 font-semibold">
                    <Link href={`/events?id=${event.id}`} className="hover:underline">
                      {eventTypeLabels[event.type]}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 whitespace-nowrap text-muted">
                    {event.date} {event.time}
                  </td>
                  <td className="py-2.5 pr-4 tabular-nums">{eventFigure(event)}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{Math.round(event.stats.peakBrakePct)}%</td>
                  <td className="py-2.5 text-right">{event.score === null ? <span className="text-muted">해당 없음</span> : <ScorePill score={event.score} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel>
          <PanelHeader title="운전 습관 항목별 점수" />
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="항목 선택">
            {[{ key: null, label: "전체" }, ...period.habits].map((item) => (
              <button
                key={item.key ?? "all"}
                type="button"
                aria-pressed={habit === item.key}
                onClick={() => setHabit(item.key as HabitKey | null)}
                className={`rounded-md border px-2.5 py-1 text-[13px] font-medium transition-colors ${
                  habit === item.key ? "border-brand bg-brand text-white" : "border-line text-muted hover:text-ink"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,1fr)_200px]">
            <RadarChart habits={period.habits} selected={habit} onSelect={setHabit} />
            <div className="rounded-lg bg-canvas p-4" aria-live="polite">
              <p className="text-sm font-bold">{selectedHabit ? `${selectedHabit.label} ${selectedHabit.score}점` : "요약"}</p>
              <p className="mt-2 text-[13px] leading-relaxed">
                {selectedHabit ? (
                  habitTips[selectedHabit.key]
                ) : (
                  <>
                    <b>{best.label}</b> 항목이 {best.score}점으로 가장 안정적입니다. 다음으로 개선할 항목은 <b>{weakest.label}</b>({weakest.score}점)입니다.
                  </>
                )}
              </p>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="주간 점수 변화" action={<ChartLegend series={weeklySeries} />} />
          <LineChart
            labels={weekly.labels}
            series={weeklySeries}
            height={250}
            ariaLabel={`요일별 점수. 이번 주 일요일 ${weekly.current[weekly.current.length - 1]}점, 지난주 일요일 ${weekly.previous[weekly.previous.length - 1]}점`}
          />
        </Panel>
      </div>

      <Panel id="trips">
        <PanelHeader title="최근 운전 기록" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th scope="col" className="py-2 pr-4 font-medium">일시</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">거리</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">시간</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">사건</th>
                <th scope="col" className="py-2 pr-4 font-medium">동기화</th>
                <th scope="col" className="py-2 text-right font-medium">점수</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={`${trip.date}-${trip.time}`} className="border-b border-line last:border-b-0">
                  <td className="py-2.5 pr-4 whitespace-nowrap">
                    <span className="font-semibold">{trip.date}</span> <span className="text-muted">{trip.time}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{trip.distanceKm} km</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{trip.minutes}분</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{trip.events}건</td>
                  <td className={`py-2.5 pr-4 font-medium ${trip.sync === "양호" ? "text-good" : "text-caution"}`}>{trip.sync}</td>
                  <td className="py-2.5 text-right">
                    <ScorePill score={trip.score} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
