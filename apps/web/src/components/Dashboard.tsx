"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronIcon, PinIcon } from "@/components/Icons";
import { DeviceOverview } from "@/components/DeviceOverview";
import { PedalEventIcon, pedalActionLabel } from "@/components/PedalEventIcon";
import { ChartLegend, LineChart, type Series } from "@/components/LineChart";
import { RadarChart } from "@/components/RadarChart";
import { ScoreRing } from "@/components/ScoreRing";
import { ScoreExplanation } from "@/components/ScoreExplanation";
import { SegmentBar, type Segment } from "@/components/SegmentBar";
import { PageHeader, Panel, PanelHeader, SampleBadge } from "@/components/ui";
import { ACCEL_COLOR, BRAKE_COLOR, eventAlerts, eventLocation, eventTypeLabels, formatMs, pedalSamples, type PedalEvent } from "@/lib/pedal";
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

function miniTrendPath(values: number[]) {
  const min = Math.min(...values) - 2;
  const max = Math.max(...values) + 2;
  return values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 76;
      const y = 28 - ((value - min) / Math.max(max - min, 1)) * 24;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
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
        description="기간별 점수와 달라진 운전 습관을 편하게 확인해 보세요."
        action={<SampleBadge />}
      />

      <section className="overflow-hidden rounded-2xl border border-line/90 bg-white shadow-[0_12px_34px_rgba(15,31,54,0.05)]">
        <div className="grid items-center gap-4 p-5 sm:p-7 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8">
          <div className="flex flex-col items-center border-b border-line/80 pb-6 lg:border-r lg:border-b-0 lg:pb-0 lg:pr-8">
            <p className="mb-3 text-[11px] font-bold tracking-[0.16em] text-brand uppercase">나의 운전 점수</p>
            <ScoreRing score={score} large />
            <p className="mt-4 text-xl font-bold">{scoreBand(score)}</p>
            <p className="mt-1 text-sm font-semibold text-good">{period.compareLabel} 대비 +{period.scoreChange}점</p>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-muted">{period.label}</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">점수 흐름을 한눈에 비교해 보세요</h2>
              </div>
              <p className="text-xs text-muted">기간을 누르면 바로 바뀝니다</p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3" role="group" aria-label="점수 조회 기간">
            {periodOrder.map((key) => {
              const item = periods[key];
              const itemScore = overallScore(item.subScores);
              const selected = periodKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setPeriodKey(key)}
                  className={`min-w-0 rounded-xl border p-3 text-left transition-all sm:p-4 ${selected ? "border-brand bg-[#f1f6fc] shadow-[0_0_0_1px_rgba(23,63,115,.08)]" : "border-line bg-white hover:border-[#b9c8d9]"}`}
                >
                  <span className="block text-[11px] font-semibold text-muted sm:text-xs">{item.label}</span>
                  <span className="mt-1 flex items-end justify-between gap-1">
                    <span className={`text-2xl font-bold tracking-tight tabular-nums sm:text-[28px] ${selected ? "text-brand" : "text-ink"}`}>
                      {itemScore}<span className="ml-0.5 text-[11px] font-medium text-muted">점</span>
                    </span>
                    <svg viewBox="0 0 76 32" className="hidden h-8 w-[76px] sm:block" aria-hidden>
                      <path d={miniTrendPath(item.trendCurrent)} fill="none" stroke={selected ? "#173f73" : "#9aa8ba"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold text-good sm:text-[11px]">+{item.scoreChange}점 좋아짐</span>
                </button>
              );
            })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-[#f8fafc] px-4 py-3 text-xs">
              <span><b className="text-ink">{best.label} {best.score}점</b> · 가장 안정적이에요</span>
              <span className="text-muted"><b className="text-caution">{weakest.label} {weakest.score}점</b> · 조금 더 살펴보세요</span>
              <span className="text-muted">평균 페달 전환 <b className="text-ink">{averages.transitionMs}ms</b></span>
            </div>
          </div>
        </div>
      </section>

      <DeviceOverview />

      <ScoreExplanation score={score} subScores={period.subScores} events={events} />

      <details className="group rounded-2xl border border-line/90 bg-white shadow-[0_8px_24px_rgba(15,31,54,0.035)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:hidden sm:px-6">
          <span>
            <span className="block text-sm font-bold">더 자세히 보기</span>
            <span className="mt-0.5 block text-xs text-muted">추세, 페달 분포, 최근 운전 기록 등 보조 지표</span>
          </span>
          <span className="flex size-8 items-center justify-center rounded-full bg-canvas text-brand transition-transform group-open:rotate-90">
            <ChevronIcon className="size-4" />
          </span>
        </summary>
        <div className="space-y-5 border-t border-line/80 p-3 sm:p-5">

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
          <PanelHeader title="조금 더 살펴볼 장면" description="항목을 누르면 당시의 페달 움직임으로 이동합니다." />
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
                    <span className="mt-1 flex items-center gap-1 text-[11px] text-muted"><PinIcon className="size-3" />{eventLocation(alert.event)}</span>
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
          title="최근 주행 장면"
          description="장면을 누르면 발과 페달이 움직인 과정을 단계별로 확인할 수 있습니다."
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
                <th scope="col" className="py-2 pr-4 font-medium">발 · 페달 동작</th>
                <th scope="col" className="py-2 pr-4 font-medium">일시</th>
                <th scope="col" className="py-2 pr-4 font-medium">주요 지표</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">최대 제동</th>
                <th scope="col" className="py-2 text-right font-medium">반응 지표</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 5).map((event) => (
                <tr key={event.id} className="border-b border-line last:border-b-0 hover:bg-canvas">
                  <td className="py-2.5 pr-4">
                    <Link href={`/events?id=${event.id}`} className="group flex min-w-[220px] items-center gap-2.5">
                      <PedalEventIcon type={event.type} className="h-11 w-[68px] shrink-0" />
                      <span>
                        <span className="block font-semibold group-hover:underline">{eventTypeLabels[event.type]}</span>
                        <span className="mt-0.5 block text-[11px] font-medium text-brand">{pedalActionLabel(event.type)}</span>
                        <span className="mt-1 flex items-center gap-1 text-[11px] text-muted"><PinIcon className="size-3" />{eventLocation(event)}</span>
                      </span>
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
                <th scope="col" className="py-2 pr-4 text-right font-medium">장면</th>
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
        </div>
      </details>
    </>
  );
}
