"use client";

import Link from "next/link";
import { ChevronIcon } from "@/components/Icons";
import { HabitRadar } from "@/components/HabitRadar";
import { LineChart, type Series } from "@/components/LineChart";
import { ScoreRing } from "@/components/ScoreRing";
import { SampleBadge } from "@/components/ui";
import { accumulatedHabitSummary } from "@/lib/habit-summary";
import { formatMs, pedalSamples } from "@/lib/pedal";

function mean(values: number[]): number {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function Dashboard() {
  const { provenance, scope, averages, events, thresholds } = pedalSamples;
  const scoredEvents = events.filter((event) => event.score !== null);
  const reactionScore = mean(scoredEvents.map((event) => event.score as number));
  const habitScore = accumulatedHabitSummary.overall;
  const strongestDecel = [...events].sort((a, b) => b.stats.peakDecelG - a.stats.peakDecelG)[0];
  const slowestTransition = [...scoredEvents].sort((a, b) => (b.metrics.transitionMs ?? 0) - (a.metrics.transitionMs ?? 0))[0];
  const overlapEvent = events.find((event) => event.type === "overlap");
  const scoreSeries: Series[] = [{
    name: "사건별 반응 점수",
    values: scoredEvents.map((event) => event.score as number),
    color: "var(--color-data)",
    emphasized: true,
  }];
  const habitTrendSeries: Series[] = [{
    name: "종합 운전 습관",
    values: accumulatedHabitSummary.history.map((item) => item.score),
    color: "var(--color-data)",
    emphasized: true,
  }];

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold tracking-[.15em] text-brand uppercase">PSI Studio</p>
            <SampleBadge />
          </div>
          <h1 className="mt-2 text-[26px] leading-tight font-bold tracking-[-.035em] sm:text-[32px]">운전 요약</h1>
          <p className="mt-2 text-sm text-muted">{provenance.displayPeriod.label} · {provenance.displayPeriod.note}</p>
        </div>
        <Link href="/events" className="inline-flex items-center gap-1 rounded-xl bg-brand px-4 py-3 text-xs font-bold text-white">
          주행 장면 보기 <ChevronIcon className="size-3.5" />
        </Link>
      </header>

      <section aria-label="누적 시연 데이터 요약" className="grid grid-cols-3 overflow-hidden rounded-2xl bg-navy text-white shadow-[0_12px_28px_rgba(11,29,53,.14)]">
        <div className="flex min-h-[76px] flex-col items-center justify-center px-2 py-3 text-center"><p className="text-[10px] font-medium text-white/65">누적 주행</p><p className="mt-1 text-base font-extrabold tabular-nums">{accumulatedHabitSummary.drives}회</p></div>
        <div className="flex min-h-[76px] flex-col items-center justify-center border-l border-white/10 px-2 py-3 text-center"><p className="text-[10px] font-medium text-white/65">누적 거리</p><p className="mt-1 text-base font-extrabold tabular-nums">{accumulatedHabitSummary.distanceKm}km</p></div>
        <div className="flex min-h-[76px] flex-col items-center justify-center border-l border-white/10 px-2 py-3 text-center"><p className="text-[10px] font-medium text-white/65">분석 시간</p><p className="mt-1 text-base font-extrabold tabular-nums">{accumulatedHabitSummary.drivingHours}시간</p></div>
      </section>

      <section className="rounded-[28px] border border-line bg-white p-5 shadow-[0_12px_34px_rgba(15,31,54,.05)] sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[11px] font-extrabold tracking-[.12em] text-brand uppercase">Score history</p><h2 className="mt-1 text-xl font-extrabold">누적 점수 변화</h2><p className="mt-1 text-xs text-muted">{accumulatedHabitSummary.period} · 주행이 쌓일수록 전체 습관의 변화를 비교합니다.</p></div>
          <p className="rounded-full bg-[#eef5ff] px-3 py-2 text-xs font-bold text-brand">66점 → 73점 · +7</p>
        </div>
        <div className="mt-5"><LineChart labels={accumulatedHabitSummary.history.map((item) => item.label)} series={habitTrendSeries} height={220} domain={[40, 100]} ticks={[40, 60, 80, 100]} ariaLabel="누적 운전 습관 점수가 66점에서 73점으로 변화한 시연 그래프" /></div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(300px,.8fr)_minmax(0,1.2fr)]">
        <article className="relative flex min-h-[340px] flex-col items-center justify-center overflow-hidden rounded-[28px] border border-[#d8e5f7] bg-[radial-gradient(circle_at_50%_20%,#ffffff_0%,#f4f8fe_55%,#eaf2fd_100%)] p-6 shadow-[0_18px_44px_rgba(15,31,54,.08)]">
          <span className="absolute -top-16 -right-12 size-44 rounded-full bg-brand/5" aria-hidden />
          <div className="relative w-full text-center"><p className="text-xs font-bold tracking-[.12em] text-brand uppercase">Accumulated driving score</p><h2 className="mt-1 text-xl font-extrabold">종합 운전 습관 점수</h2></div>
          <ScoreRing score={habitScore} large />
          <p className="mt-1 text-3xl font-black tracking-tight">{habitScore}<span className="ml-1 text-base font-bold text-muted">점</span></p>
          <p className="mt-2 text-center text-xs text-muted">누적 {accumulatedHabitSummary.drives}회 · {accumulatedHabitSummary.distanceKm}km · 4개 영역 종합</p>
          <Link href="/score-guide" className="mt-4 inline-flex items-center gap-1 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white">점수 계산법 보기 <ChevronIcon className="size-3" /></Link>
        </article>

        <Link href={`/events?id=${slowestTransition.id}`} className="group relative flex min-h-[340px] flex-col overflow-hidden rounded-[28px] bg-[linear-gradient(145deg,#10223f,#173f73_62%,#246ce2)] p-6 text-white shadow-[0_18px_44px_rgba(17,49,92,.2)] sm:p-8">
          <span className="absolute -right-20 -bottom-24 size-72 rounded-full border-[36px] border-white/5" aria-hidden />
          <div className="relative flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold tracking-[.15em] text-blue-200 uppercase">Key moment</p><h2 className="mt-2 text-2xl font-extrabold">가장 길었던 페달 전환</h2></div><ChevronIcon className="size-6 transition group-hover:translate-x-1" /></div>
          <div className="relative mt-auto">
            <p className="text-5xl font-black tracking-[-.05em] tabular-nums">{formatMs(slowestTransition.metrics.transitionMs ?? 0)}</p>
            <p className="mt-2 text-sm text-white/65">{slowestTransition.date} {slowestTransition.time}</p>
            <div className="mt-6 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 text-center">
              <span className="rounded-xl bg-white/10 px-2 py-3 text-xs font-bold">가속 해제</span><span className="text-white/35">→</span>
              <span className="rounded-xl bg-white px-2 py-3 text-xs font-extrabold text-brand">발 이동</span><span className="text-white/35">→</span>
              <span className="rounded-xl bg-white/10 px-2 py-3 text-xs font-bold">브레이크</span>
            </div>
            <p className="mt-4 text-xs font-bold text-blue-200">장면 애니메이션 보기</p>
          </div>
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
        <article className="rounded-[28px] border border-line bg-white p-5 shadow-[0_12px_34px_rgba(15,31,54,.05)] sm:p-6">
          <div><p className="text-[11px] font-extrabold tracking-[.12em] text-brand uppercase">Habit balance</p><h2 className="mt-1 text-xl font-extrabold">운전 습관 균형</h2></div>
          <HabitRadar domains={accumulatedHabitSummary.domains} />
        </article>
        <div className="grid gap-3 sm:grid-cols-2">
          {accumulatedHabitSummary.domains.map((domain) => (
            <article key={domain.key} className="rounded-2xl border border-line/90 p-5 shadow-[0_8px_24px_rgba(15,31,54,.04)]" style={{ backgroundColor: domain.soft }}>
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold" style={{ color: domain.color }}>{domain.label}</p><p className="mt-1 text-[11px] text-muted">{domain.description}</p></div><span className="text-3xl font-black tabular-nums" style={{ color: domain.color }}>{domain.score}</span></div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/80"><div className="h-full rounded-full" style={{ width: `${domain.score}%`, backgroundColor: domain.color }} /></div>
              <p className="mt-2 text-[10px] font-semibold text-muted">종합점수 반영 {Math.round(domain.weight * 100)}%</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3"><h2 className="text-lg font-bold">이번 분석에서 볼 세 가지</h2><p className="mt-1 text-xs text-muted">핵심 값만 남기고 원본 장면으로 바로 연결했습니다.</p></div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href={`/events?id=${slowestTransition.id}`} className="group rounded-2xl border border-line/90 border-t-[3px] border-t-[#e8863a] bg-white p-5 shadow-[0_10px_28px_rgba(15,31,54,.05)] transition hover:-translate-y-1 hover:shadow-lg motion-reduce:transform-none">
            <p className="text-xs font-semibold text-muted">평균 페달 전환</p><p className="mt-2 text-2xl font-extrabold tabular-nums">{formatMs(averages.transitionMs)}</p><p className="mt-1 text-[11px] text-muted">가속 해제 → 브레이크 접촉</p>
          </Link>
          <Link href={`/events?id=${strongestDecel.id}`} className="group rounded-2xl border border-line/90 border-t-[3px] border-t-alert bg-white p-5 shadow-[0_10px_28px_rgba(15,31,54,.05)] transition hover:-translate-y-1 hover:shadow-lg motion-reduce:transform-none">
            <p className="text-xs font-semibold text-muted">급감속 후보</p><p className="mt-2 text-2xl font-extrabold tabular-nums">{scope.hardBrakes}건</p><p className="mt-1 text-[11px] text-muted">IMU {thresholds.hardBrakeG}g 이하 · 내부 기준</p>
          </Link>
          <Link href={overlapEvent ? `/events?id=${overlapEvent.id}` : "/events"} className="group rounded-2xl border border-line/90 border-t-[3px] border-t-[#7c3aed] bg-white p-5 shadow-[0_10px_28px_rgba(15,31,54,.05)] transition hover:-translate-y-1 hover:shadow-lg motion-reduce:transform-none">
            <p className="text-xs font-semibold text-muted">페달 중첩 대표 장면</p><p className="mt-2 text-2xl font-extrabold tabular-nums">{events.filter((event) => event.type === "overlap").length}건</p><p className="mt-1 text-[11px] text-muted">두 페달 입력이 겹친 재생 장면</p>
          </Link>
        </div>
      </section>

      <details className="group rounded-2xl border border-line/90 bg-white shadow-[0_8px_24px_rgba(15,31,54,.035)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 marker:hidden sm:px-6">
          <span><b className="block text-sm">최근 위험 대응 장면 보기</b><span className="mt-1 block text-xs text-muted">{provenance.displayPeriod.label} · 위험 대응 영역 {reactionScore}점의 최근 장면입니다.</span></span>
          <span className="font-bold text-brand group-open:hidden">열기</span><span className="hidden font-bold text-brand group-open:inline">닫기</span>
        </summary>
        <div className="border-t border-line/80 p-5 sm:p-6">
          <LineChart labels={scoredEvents.map((event) => event.id)} series={scoreSeries} height={220} ariaLabel={`합성 주의 장면 ${scoredEvents.length}건의 반응 점수. 평균 ${reactionScore}점`} />
        </div>
      </details>

    </>
  );
}
