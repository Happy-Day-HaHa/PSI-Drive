"use client";

import Link from "next/link";
import { ChevronIcon } from "@/components/Icons";
import { LineChart, type Series } from "@/components/LineChart";
import { ScoreRing } from "@/components/ScoreRing";
import { SampleBadge } from "@/components/ui";
import { accumulatedHabitSummary } from "@/lib/habit-summary";
import { formatMs, pedalSamples } from "@/lib/pedal";

function mean(values: number[]): number {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function Dashboard() {
  const { provenance, averages, events } = pedalSamples;
  const scoredEvents = events.filter((event) => event.score !== null);
  const reactionScore = mean(scoredEvents.map((event) => event.score as number));
  const strongest = [...accumulatedHabitSummary.domains].sort((a, b) => b.score - a.score)[0];
  const weakest = [...accumulatedHabitSummary.domains].sort((a, b) => a.score - b.score)[0];
  const slowestTransition = [...scoredEvents].sort((a, b) => (b.metrics.transitionMs ?? 0) - (a.metrics.transitionMs ?? 0))[0];
  const trendSeries: Series[] = [{
    name: "종합 운전 습관",
    values: accumulatedHabitSummary.history.map((item) => item.score),
    color: "var(--color-data)",
    emphasized: true,
  }];
  const reactionSeries: Series[] = [{
    name: "위험 대응",
    values: scoredEvents.map((event) => event.score as number),
    color: "var(--color-data)",
    emphasized: true,
  }];

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line/80 pb-5">
        <div>
          <div className="flex items-center gap-2"><p className="text-[11px] font-bold tracking-[.15em] text-brand uppercase">PSI Studio</p><SampleBadge /></div>
          <h1 className="mt-2 text-[26px] leading-tight font-bold tracking-[-.035em] sm:text-[32px]">내 운전 습관</h1>
          <p className="mt-2 text-sm text-muted">{accumulatedHabitSummary.period} · 누적 {accumulatedHabitSummary.drives}회 · {accumulatedHabitSummary.distanceKm}km</p>
        </div>
        <Link href="/events" className="inline-flex items-center gap-1 rounded-xl bg-brand px-4 py-3 text-xs font-bold text-white">주행 기록 보기 <ChevronIcon className="size-3.5" /></Link>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <article className="relative grid min-h-[310px] overflow-hidden rounded-[28px] bg-[linear-gradient(145deg,#10223f,#173f73_62%,#246ce2)] p-6 text-white shadow-[0_18px_44px_rgba(17,49,92,.2)] sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8 sm:p-8">
          <span className="absolute -right-20 -bottom-24 size-72 rounded-full border-[36px] border-white/5" aria-hidden />
          <div className="relative flex justify-center"><ScoreRing score={accumulatedHabitSummary.overall} large /></div>
          <div className="relative text-center sm:text-left">
            <p className="text-xs font-bold tracking-[.12em] text-blue-200 uppercase">Overall score</p>
            <h2 className="mt-2 text-3xl font-black">전체적으로 안정적이에요</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">운전 습관 점수 <b className="text-white">{accumulatedHabitSummary.overall}점</b>입니다.<br />페달 조작은 좋고, 위험 대응은 조금 더 개선할 수 있어요.</p>
            <Link href="/score-guide" className="mt-5 inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-xs font-bold text-brand">점수 계산법 <ChevronIcon className="size-3" /></Link>
          </div>
        </article>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <article className="flex items-center justify-between rounded-2xl border border-[#cfe8dc] bg-[#effaf5] p-5">
            <div><p className="text-[11px] font-bold text-[#16855b]">가장 좋은 습관</p><h2 className="mt-1 text-lg font-extrabold">{strongest.label}</h2><p className="mt-1 text-xs text-muted">지금처럼 유지해 보세요</p></div>
            <p className="text-4xl font-black text-[#16855b]">{strongest.score}<span className="text-sm">점</span></p>
          </article>
          <article className="flex items-center justify-between rounded-2xl border border-[#f5d0d5] bg-[#fff1f3] p-5">
            <div><p className="text-[11px] font-bold text-alert">먼저 개선할 습관</p><h2 className="mt-1 text-lg font-extrabold">{weakest.label}</h2><p className="mt-1 text-xs text-muted">조금 더 빠르게 반응해 보세요</p></div>
            <p className="text-4xl font-black text-alert">{weakest.score}<span className="text-sm">점</span></p>
          </article>
        </div>
      </section>

      <section className="rounded-[28px] border border-line bg-white p-5 shadow-[0_12px_34px_rgba(15,31,54,.05)] sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[11px] font-extrabold tracking-[.12em] text-brand uppercase">4 driving habits</p><h2 className="mt-1 text-xl font-extrabold">4개 습관 한눈에 보기</h2></div><p className="text-xs text-muted">높을수록 좋은 습관입니다</p></div>
        <div className="mt-6 space-y-5">
          {accumulatedHabitSummary.domains.map((domain) => (
            <div key={domain.key} className="grid grid-cols-[92px_1fr_42px] items-center gap-3 sm:grid-cols-[130px_1fr_50px]">
              <div><p className="text-sm font-bold">{domain.label}</p><p className="mt-0.5 hidden text-[10px] text-muted sm:block">{domain.description}</p></div>
              <div className="h-3 overflow-hidden rounded-full bg-[#edf1f5]"><div className="h-full rounded-full" style={{ width: `${domain.score}%`, backgroundColor: domain.color }} /></div>
              <p className="text-right text-lg font-black tabular-nums" style={{ color: domain.color }}>{domain.score}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-line bg-white p-5 shadow-[0_12px_34px_rgba(15,31,54,.05)] sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[11px] font-extrabold tracking-[.12em] text-brand uppercase">Score history</p><h2 className="mt-1 text-xl font-extrabold">좋아지고 있어요</h2><p className="mt-1 text-xs text-muted">최근 누적 점수가 66점에서 73점으로 올랐습니다.</p></div>
          <p className="rounded-full bg-[#eef5ff] px-3 py-2 text-xs font-bold text-brand">+7점</p>
        </div>
        <div className="mt-4"><LineChart labels={accumulatedHabitSummary.history.map((item) => item.label)} series={trendSeries} height={210} domain={[40, 100]} ticks={[40, 60, 80, 100]} ariaLabel="누적 운전 습관 점수가 66점에서 73점으로 오른 시연 그래프" /></div>
      </section>

      <details className="group rounded-[28px] border border-line bg-white shadow-[0_8px_24px_rgba(15,31,54,.035)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 marker:hidden sm:p-6">
          <span><b className="block text-base">더 자세한 분석 보기</b><span className="mt-1 block text-xs text-muted">페달 전환과 위험 대응 장면을 확인합니다.</span></span>
          <span className="font-bold text-brand group-open:hidden">열기</span><span className="hidden font-bold text-brand group-open:inline">닫기</span>
        </summary>
        <div className="space-y-6 border-t border-line/80 p-5 sm:p-6">
          <Link href={`/events?id=${slowestTransition.id}`} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#f5f9ff] p-5">
            <div><p className="text-xs font-bold text-brand">확인할 장면</p><h3 className="mt-1 text-lg font-extrabold">가장 길었던 페달 전환</h3><p className="mt-1 text-xs text-muted">{slowestTransition.date} {slowestTransition.time}</p></div>
            <div className="text-right"><p className="text-3xl font-black text-brand">{formatMs(slowestTransition.metrics.transitionMs ?? 0)}</p><p className="mt-1 text-xs font-bold text-brand">장면 보기 →</p></div>
          </Link>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-line p-4"><p className="text-xs text-muted">평균 페달 전환</p><p className="mt-1 text-2xl font-extrabold">{formatMs(averages.transitionMs)}</p></div>
            <div className="rounded-2xl border border-line p-4"><p className="text-xs text-muted">위험 대응 영역</p><p className="mt-1 text-2xl font-extrabold">{reactionScore}점</p></div>
          </div>
          <div><div className="mb-3"><h3 className="text-sm font-extrabold">최근 위험 대응 장면</h3><p className="mt-1 text-xs text-muted">{provenance.displayPeriod.label} · 장면별 반응 점수</p></div><LineChart labels={scoredEvents.map((event) => event.id)} series={reactionSeries} height={210} ariaLabel={`합성 주의 장면 ${scoredEvents.length}건의 위험 대응 점수. 평균 ${reactionScore}점`} /></div>
        </div>
      </details>
    </>
  );
}
