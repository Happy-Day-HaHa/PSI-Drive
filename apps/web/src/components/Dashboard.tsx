"use client";

import Link from "next/link";
import { ChevronIcon } from "@/components/Icons";
import { ChartLegend, LineChart, type Series } from "@/components/LineChart";
import { ScoreRing } from "@/components/ScoreRing";
import { EvidenceDisclosure, SampleBadge } from "@/components/ui";
import { eventTypeLabels, formatMs, pedalSamples } from "@/lib/pedal";

function mean(values: number[]): number {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function Dashboard() {
  const { source, configVersion, provenance, scope, averages, events, thresholds } = pedalSamples;
  const scoredEvents = events.filter((event) => event.score !== null);
  const reactionScore = mean(scoredEvents.map((event) => event.score as number));
  const overlapEvents = events.filter((event) => event.type === "overlap");
  const strongestDecel = [...events].sort((a, b) => b.stats.peakDecelG - a.stats.peakDecelG)[0];
  const slowestTransition = [...scoredEvents].sort((a, b) => (b.metrics.transitionMs ?? 0) - (a.metrics.transitionMs ?? 0))[0];
  const scoreSeries: Series[] = [{ name: "사건별 반응 점수", values: scoredEvents.map((event) => event.score as number), color: "var(--color-data)", emphasized: true }];
  const summary = [
    { label: "합성 주행 거리", value: `${scope.distanceKm}km`, note: `${scope.drivingMinutes}분 신호에서 속도를 적분`, href: "/pedal" },
    { label: "급가속 구간", value: `${scope.hardAccels}건`, note: `IMU +${thresholds.hardAccelG}g 이상`, href: "/pedal#accel-pattern" },
    { label: "급감속 구간", value: `${scope.hardBrakes}건`, note: `IMU ${thresholds.hardBrakeG}g 이하`, href: `/events?id=${strongestDecel.id}` },
    { label: "평균 페달 전환", value: formatMs(averages.transitionMs), note: "T2 가속 해제 → T4 브레이크 접촉", href: `/events?id=${slowestTransition.id}` },
    { label: "대표 중첩 장면", value: `${overlapEvents.length}건`, note: "두 페달 압력이 동시에 ON인 재생 장면", href: overlapEvents[0] ? `/events?id=${overlapEvents[0].id}` : "/events" },
  ];

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold tracking-[.15em] text-brand uppercase">PSI Studio</p>
            <SampleBadge />
          </div>
          <h1 className="mt-2 text-[26px] leading-tight font-bold tracking-[-.035em] sm:text-[32px]">근거가 확인되는 수치만 보여드려요</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">현재 대시보드는 고정 시드로 재생성할 수 있는 합성 센서 기록과 설정 {configVersion}에서 직접 계산한 값만 사용합니다.</p>
        </div>
      </header>

      <EvidenceDisclosure source={source} configVersion={configVersion} sessions={scope.sessions} events={scope.hazardEvents} seeds={provenance.sessionSeeds} sampleIntervalMs={provenance.sampleIntervalMs} formula={provenance.scoreFormula} limitation={provenance.limitation} />

      <section aria-label="합성 분석 요약" className="grid grid-cols-3 overflow-hidden rounded-2xl bg-navy text-white shadow-[0_12px_28px_rgba(11,29,53,.14)]">
        <div className="flex min-h-[82px] flex-col items-center justify-center px-2 py-3 text-center"><p className="text-[10px] font-medium text-white/65">합성 세션</p><p className="mt-1 text-base font-extrabold tabular-nums">{scope.sessions}개</p></div>
        <div className="flex min-h-[82px] flex-col items-center justify-center border-l border-white/10 px-2 py-3 text-center"><p className="text-[10px] font-medium text-white/65">주의 장면</p><p className="mt-1 text-base font-extrabold tabular-nums">{scope.hazardEvents}건</p></div>
        <div className="flex min-h-[82px] flex-col items-center justify-center border-l border-white/10 px-2 py-3 text-center"><p className="text-[10px] font-medium text-white/65">표본 간격</p><p className="mt-1 text-base font-extrabold tabular-nums">{provenance.sampleIntervalMs}ms</p></div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(320px,.8fr)_minmax(0,1.2fr)]">
        <article className="flex flex-col items-center justify-center rounded-2xl border border-line/90 bg-white p-6 shadow-[0_12px_34px_rgba(15,31,54,.05)]">
          <div className="w-full"><p className="text-xs font-semibold text-muted">주의 장면 {scoredEvents.length}건</p><h2 className="mt-1 text-lg font-bold">평균 반응 점수</h2></div>
          <ScoreRing score={reactionScore} large />
          <p className="mt-2 text-xl font-bold">{reactionScore}점</p>
          <p className="mt-2 text-center text-xs leading-relaxed text-muted">인지-해제·페달 전환·총 제동 반응을 각각 설정 {configVersion} 곡선으로 환산한 뒤 평균했습니다.</p>
          <span className="mt-4 rounded-full bg-caution-soft px-3 py-1 text-[11px] font-bold text-caution">Phase 4 확정 전 임시 산식</span>
        </article>

        <article className="rounded-2xl border border-line/90 bg-white p-5 shadow-[0_12px_34px_rgba(15,31,54,.05)] sm:p-6">
          <h2 className="text-lg font-bold">사건별 반응 점수</h2>
          <p className="mt-1 text-xs text-muted">기간 추세가 아니라 동일 생성 묶음 안의 사건별 산출값입니다.</p>
          <div className="mt-3"><ChartLegend series={scoreSeries} /></div>
          <LineChart labels={scoredEvents.map((event) => event.id)} series={scoreSeries} height={220} ariaLabel={`합성 주의 장면 ${scoredEvents.length}건의 반응 점수. 평균 ${reactionScore}점`} />
        </article>
      </section>

      <section>
        <div className="mb-3"><h2 className="text-lg font-bold">센서 기록에서 직접 집계한 값</h2><p className="mt-1 text-xs text-muted">각 카드의 설명에 사용 신호와 판정 기준을 함께 표시했습니다.</p></div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {summary.map((item) => (
            <Link key={item.label} href={item.href} className="group rounded-2xl border border-line/90 bg-white p-4 shadow-[0_8px_22px_rgba(15,31,54,.035)] transition hover:border-[#bfd4f6]">
              <p className="text-xs font-semibold text-muted">{item.label}</p>
              <p className="mt-2 text-[22px] font-bold tracking-tight tabular-nums">{item.value}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">{item.note}</p>
              <span className="mt-3 inline-flex items-center gap-0.5 text-[10px] font-bold text-brand">원본 장면 확인<ChevronIcon className="size-3" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-line/90 bg-white p-5 shadow-[0_10px_28px_rgba(15,31,54,.04)] sm:p-6">
        <div className="flex items-end justify-between gap-3"><div><h2 className="text-lg font-bold">근거 장면</h2><p className="mt-1 text-xs text-muted">표시된 수치는 모두 아래 합성 사건의 마커와 시계열로 역추적할 수 있습니다.</p></div><Link href="/events" className="inline-flex items-center gap-0.5 text-xs font-bold text-brand">전체 보기<ChevronIcon className="size-3.5" /></Link></div>
        <div className="mt-4 grid gap-2">
          {events.slice(0, 4).map((event) => (
            <Link key={event.id} href={`/events?id=${event.id}`} className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-line/80 px-4 py-3 transition hover:border-[#c9daf3] hover:bg-[#f8fafc]">
              <span className="min-w-0"><span className="flex flex-wrap items-center gap-x-2 text-sm"><b>{event.id} · {eventTypeLabels[event.type]}</b><span className="text-xs text-muted">{event.date} {event.time}</span></span><span className="mt-1 block text-[11px] text-muted">압력 센서·IMU·마커 차이로 산출 · 설정 {configVersion}</span></span>
              <span className="flex items-center gap-2">{event.score !== null && <span className="rounded-lg bg-[#eef4fb] px-2.5 py-1.5 text-sm font-bold text-brand">{event.score}점</span>}<ChevronIcon className="size-4 text-muted" /></span>
            </Link>
          ))}
        </div>
      </section>

      <p className="rounded-xl border border-[#f0dfc8] bg-[#fffaf3] px-4 py-3 text-xs leading-relaxed text-muted"><b className="text-ink">해석 주의:</b> 이 수치들은 UI와 분석 파이프라인을 검증하기 위한 합성 결과입니다. 실제 운전자 성향, 사고 위험 감소율, 안전 수준 또는 법적 과실의 근거로 사용할 수 없습니다.</p>
    </>
  );
}
