"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronIcon, PinIcon } from "@/components/Icons";
import { ChartLegend, LineChart, type Series } from "@/components/LineChart";
import { ScoreExplanation } from "@/components/ScoreExplanation";
import { ScoreRing } from "@/components/ScoreRing";
import { SampleBadge } from "@/components/ui";
import { pedalSamples } from "@/lib/pedal";
import { driver, overallScore, periodOrder, periods, trips, type PeriodKey } from "@/lib/sample-data";

const periodShort: Record<PeriodKey, string> = { "7d": "주", "30d": "월", "90d": "3개월" };

function friendlyBand(score: number) {
  if (score >= 90) return "아주 좋아요";
  if (score >= 80) return "안정적이에요";
  if (score >= 70) return "조금씩 좋아지고 있어요";
  return "천천히 함께 살펴봐요";
}

function scoreTone(score: number) {
  if (score >= 85) return "bg-good-soft text-good";
  if (score >= 75) return "bg-caution-soft text-caution";
  return "bg-[#feecef] text-alert";
}

export function Dashboard() {
  const [periodKey, setPeriodKey] = useState<PeriodKey>("7d");
  const period = periods[periodKey];
  const score = overallScore(period.subScores);
  const { averages, events } = pedalSamples;
  const metrics = Object.fromEntries(period.metrics.map((item) => [item.key, item]));
  const anchorEvent = events[0];
  const overlapEvent = events.find((event) => event.type === "overlap") ?? anchorEvent;
  const strongestDecel = [...events].sort((a, b) => b.stats.peakDecelG - a.stats.peakDecelG)[0];
  const slowestTransition = [...events]
    .filter((event) => event.metrics.transitionMs !== undefined)
    .sort((a, b) => (b.metrics.transitionMs ?? 0) - (a.metrics.transitionMs ?? 0))[0] ?? anchorEvent;
  const habits = [
    { label: "급가속", value: `${metrics.accel.value}${metrics.accel.unit}`, note: "출발과 가속이 한결 부드러워요", status: "양호", color: "#246ce2", symbol: "↗", href: "/pedal#accel-pattern" },
    { label: "급감속", value: `${metrics.brake.value}${metrics.brake.unit}`, note: "가장 강했던 감속 장면 확인", status: "양호", color: "#e24054", symbol: "!", href: `/events?id=${strongestDecel.id}` },
    { label: "페달 동시 입력", value: `${metrics.overlap.value}${metrics.overlap.unit}`, note: Number(metrics.overlap.value) === 0 ? "겹쳐 밟은 순간이 없어요" : "한 장면을 함께 확인해 봐요", status: Number(metrics.overlap.value) === 0 ? "아주 좋음" : "살펴보기", color: "#7c3aed", symbol: "⇄", href: `/events?id=${overlapEvent.id}` },
    { label: "평균 페달 전환", value: `${averages.transitionMs}ms`, note: "가속에서 브레이크까지", status: averages.transitionMs <= 350 ? "양호" : "보통", color: "#e8863a", symbol: "◷", href: `/events?id=${slowestTransition.id}` },
    { label: "주행 거리", value: `${metrics.distance.value}${metrics.distance.unit}`, note: `${metrics.time.value}${metrics.time.unit} 동안 주행`, status: "기록됨", color: "#149879", symbol: "⌁", href: "/events" },
  ];
  const trendSeries: Series[] = [
    { name: period.currentName, values: period.trendCurrent, color: "var(--color-data)", emphasized: true },
    { name: period.previousName, values: period.trendPrevious, color: "var(--color-compare)" },
  ];

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold tracking-[.15em] text-brand uppercase">PSI Studio</p>
            <SampleBadge />
          </div>
          <h1 className="mt-2 text-[26px] leading-tight font-bold tracking-[-.035em] sm:text-[32px]">
            오늘도 편안한 운전 이어가요 👋
          </h1>
          <p className="mt-2 text-sm text-muted">{driver.vehicleModel} · {driver.id}님의 운전 습관을 정리했어요.</p>
        </div>
        <div className="flex rounded-xl border border-line bg-white p-1 shadow-sm" role="group" aria-label="조회 기간">
          {periodOrder.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={periodKey === key}
              onClick={() => setPeriodKey(key)}
              className={`min-w-14 rounded-lg px-3 py-2 text-xs font-bold transition ${periodKey === key ? "bg-brand text-white shadow-sm" : "text-muted hover:text-ink"}`}
            >
              {periodShort[key]}
            </button>
          ))}
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[minmax(330px,.9fr)_minmax(0,1.25fr)]">
        <article className="flex flex-col items-center justify-center rounded-2xl border border-line/90 bg-white p-5 shadow-[0_12px_34px_rgba(15,31,54,.05)] sm:p-7">
          <div className="flex w-full items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-muted">{period.label}</p>
              <h2 className="mt-1 text-lg font-bold">운전 습관 점수</h2>
            </div>
            <span className="rounded-full bg-good-soft px-2.5 py-1 text-[11px] font-bold text-good">+{period.scoreChange}점</span>
          </div>
          <ScoreRing score={score} large />
          <p className="mt-2 text-xl font-bold">{friendlyBand(score)}</p>
          <p className="mt-1 text-sm font-semibold text-good">{period.compareLabel}보다 {period.scoreChange}점 좋아졌어요</p>
          <a href="#score-reason" className="mt-4 inline-flex items-center gap-1 rounded-lg bg-[#eef4fb] px-3 py-2 text-xs font-bold text-brand">
            점수가 이렇게 나온 이유 <ChevronIcon className="size-3.5" />
          </a>
          <div className="mt-5 grid w-full grid-cols-2 gap-x-4 gap-y-3 border-t border-line/80 pt-4">
            {period.subScores.map((item) => (
              <div key={item.key}>
                <div className="flex items-center justify-between gap-2 text-[10px]"><span className="font-semibold text-muted">{item.label}</span><b className="tabular-nums">{item.score}</b></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-track"><div className="h-full rounded-full bg-data transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${item.score}%` }} /></div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-line/90 bg-[linear-gradient(145deg,#ffffff,#f3f7ff)] p-5 shadow-[0_12px_34px_rgba(15,31,54,.05)] sm:p-7">
          <p className="text-[11px] font-bold tracking-[.13em] text-brand uppercase">이번 기간 한눈에 보기</p>
          <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">안정적인 운전 흐름을 잘 유지하고 있어요</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">좋아진 부분은 칭찬하고, 조금 더 살펴볼 부분은 부담 없이 알려드릴게요.</p>
          <ul className="mt-6 space-y-3">
            <li className="grid gap-3 rounded-xl border border-white bg-white/85 p-3.5 shadow-[0_5px_18px_rgba(15,31,54,.035)] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-good text-sm font-bold text-white">✓</span>
              <span><b className="block text-sm">급가속이 {Math.abs(metrics.accel.changePct)}% 줄었어요</b><span className="mt-0.5 block text-xs text-muted">출발과 속도 조절이 지난 기간보다 부드러워졌어요.</span></span>
              <Link href="/pedal#accel-pattern" className="ml-10 inline-flex items-center gap-0.5 text-xs font-bold text-brand sm:ml-0">변화 보기<ChevronIcon className="size-3" /></Link>
            </li>
            <li className="grid gap-3 rounded-xl border border-white bg-white/85 p-3.5 shadow-[0_5px_18px_rgba(15,31,54,.035)] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-good text-sm font-bold text-white">✓</span>
              <span><b className="block text-sm">페달 안전성이 {period.subScores.find((item) => item.key === "safety")?.score}점이에요</b><span className="mt-0.5 block text-xs text-muted">대부분의 구간에서 두 페달을 분리해 안정적으로 사용했어요.</span></span>
              <Link href={`/events?id=${overlapEvent.id}`} className="ml-10 inline-flex items-center gap-0.5 text-xs font-bold text-brand sm:ml-0">관련 장면<ChevronIcon className="size-3" /></Link>
            </li>
            <li className="grid gap-3 rounded-xl border border-[#f4e7d3] bg-[#fffaf3] p-3.5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-caution text-sm font-bold text-white">!</span>
              <span><b className="block text-sm">페달 전환은 조금 더 여유롭게</b><span className="mt-0.5 block text-xs text-muted">뒤꿈치를 축으로 움직이면 더 편안하게 전환할 수 있어요.</span></span>
              <Link href={`/events?id=${slowestTransition.id}`} className="ml-10 inline-flex items-center gap-0.5 text-xs font-bold text-caution sm:ml-0">과정 재생<ChevronIcon className="size-3" /></Link>
            </li>
          </ul>
        </article>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div><h2 className="text-lg font-bold">습관별로 살펴보기</h2><p className="mt-1 text-xs text-muted">자주 확인하는 정보만 먼저 모았어요.</p></div>
          <Link href="/pedal" className="inline-flex items-center gap-0.5 text-xs font-bold text-brand">자세히 보기<ChevronIcon className="size-3.5" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {habits.map((habit) => (
            <Link key={habit.label} href={habit.href} className="group rounded-2xl border border-line/90 bg-white p-4 shadow-[0_8px_22px_rgba(15,31,54,.035)] transition hover:-translate-y-0.5 hover:border-[#bfd4f6] hover:shadow-[0_14px_30px_rgba(15,31,54,.08)] active:translate-y-0 motion-reduce:transform-none">
              <div className="flex items-start justify-between gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl text-lg font-bold" style={{ background: `${habit.color}15`, color: habit.color }}>{habit.symbol}</span>
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${habit.status === "살펴보기" || habit.status === "보통" ? "bg-caution-soft text-caution" : "bg-good-soft text-good"}`}>{habit.status}</span>
              </div>
              <p className="mt-3 text-xs font-semibold text-muted">{habit.label}</p>
              <p className="mt-1 text-[22px] font-bold tracking-tight">{habit.value}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">{habit.note}</p>
              <span className="mt-3 inline-flex items-center gap-0.5 text-[10px] font-bold text-brand opacity-70 transition group-hover:opacity-100">확인하기<ChevronIcon className="size-3" /></span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
        <section className="rounded-2xl border border-line/90 bg-white p-5 shadow-[0_10px_28px_rgba(15,31,54,.04)] sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div><h2 className="text-lg font-bold">{period.trendTitle}</h2><p className="mt-1 text-xs text-muted">점수가 어떻게 달라졌는지 확인해 보세요.</p></div>
            <ChartLegend series={trendSeries} />
          </div>
          <LineChart labels={period.trendLabels} series={trendSeries} height={220} ariaLabel={`${period.trendTitle}. 현재 ${score}점`} />
        </section>

        <section className="rounded-2xl border border-[#dce7f7] bg-[linear-gradient(145deg,#f7faff,#edf4ff)] p-5 sm:p-6">
          <p className="text-[11px] font-bold tracking-[.12em] text-brand uppercase">이번 주 작은 목표</p>
          <h2 className="mt-2 text-lg font-bold">급가속 2회 이하로 줄여보기</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted">출발할 때 2초에 걸쳐 나누어 밟으면 훨씬 편안해져요.</p>
          <div className="mt-6 flex items-end justify-between">
            <span className="text-xs font-semibold text-muted">현재 1회 / 목표 2회</span>
            <span className="text-sm font-bold text-brand">잘하고 있어요!</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white"><div className="h-full w-1/2 rounded-full bg-data" /></div>
          <Link href="/pedal" className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-brand">나의 운전 팁 보기<ChevronIcon className="size-3.5" /></Link>
        </section>
      </div>

      <section className="rounded-2xl border border-line/90 bg-white p-5 shadow-[0_10px_28px_rgba(15,31,54,.04)] sm:p-6">
        <div className="flex items-end justify-between gap-3">
          <div><h2 className="text-lg font-bold">최근 주행 기록</h2><p className="mt-1 text-xs text-muted">언제 어디를 달렸는지 다시 확인해 보세요.</p></div>
          <Link href="/events" className="inline-flex items-center gap-0.5 text-xs font-bold text-brand">전체 보기<ChevronIcon className="size-3.5" /></Link>
        </div>
        <div className="mt-4 grid gap-2">
          {trips.slice(0, 3).map((trip) => (
            <Link key={trip.eventId} href={`/events?id=${trip.eventId}`} className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-line/80 px-4 py-3 transition hover:border-[#c9daf3] hover:bg-[#f8fafc]">
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-x-2 text-sm"><b>{trip.date}</b><span className="text-xs text-muted">{trip.time}</span></span>
                <span className="mt-1 flex items-center gap-1 text-[11px] text-muted"><PinIcon className="size-3" />{trip.location}</span>
                <span className="mt-1 block text-[11px] text-muted">{trip.distanceKm}km · {trip.minutes}분 · 돌아볼 장면 {trip.events}개</span>
              </span>
              <span className="flex items-center gap-2">
                <span className={`rounded-lg px-2.5 py-1.5 text-sm font-bold ${scoreTone(trip.score)}`}>{trip.score}점</span>
                <ChevronIcon className="size-4 text-muted transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <details id="score-reason" className="group scroll-mt-24 rounded-2xl border border-line/90 bg-white shadow-[0_8px_24px_rgba(15,31,54,.035)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 marker:hidden sm:px-6">
          <span><b className="block text-sm">내 점수가 이렇게 나온 이유</b><span className="mt-1 block text-xs text-muted">항목별 점수와 연결된 주행 장면을 확인할 수 있어요.</span></span>
          <span className="flex size-8 items-center justify-center rounded-full bg-canvas text-brand transition group-open:rotate-90"><ChevronIcon className="size-4" /></span>
        </summary>
        <div className="border-t border-line/80 p-3 sm:p-5"><ScoreExplanation score={score} subScores={period.subScores} events={events} period={period} /></div>
      </details>

    </>
  );
}
