"use client";

import Link from "next/link";
import { ChevronIcon } from "@/components/Icons";
import { LineChart, type Series } from "@/components/LineChart";
import { ScoreRing } from "@/components/ScoreRing";
import { EvidenceDisclosure, SampleBadge } from "@/components/ui";
import { formatMs, pedalSamples } from "@/lib/pedal";

function mean(values: number[]): number {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function Dashboard() {
  const { source, configVersion, provenance, scope, averages, events, thresholds, settings } = pedalSamples;
  const scoredEvents = events.filter((event) => event.score !== null);
  const reactionScore = mean(scoredEvents.map((event) => event.score as number));
  const strongestDecel = [...events].sort((a, b) => b.stats.peakDecelG - a.stats.peakDecelG)[0];
  const slowestTransition = [...scoredEvents].sort((a, b) => (b.metrics.transitionMs ?? 0) - (a.metrics.transitionMs ?? 0))[0];
  const overlapEvent = events.find((event) => event.type === "overlap");
  const scoreSeries: Series[] = [{
    name: "사건별 반응 점수",
    values: scoredEvents.map((event) => event.score as number),
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

      <section aria-label="합성 분석 요약" className="grid grid-cols-3 overflow-hidden rounded-2xl bg-navy text-white shadow-[0_12px_28px_rgba(11,29,53,.14)]">
        <div className="flex min-h-[76px] flex-col items-center justify-center px-2 py-3 text-center"><p className="text-[10px] font-medium text-white/65">합성 세션</p><p className="mt-1 text-base font-extrabold tabular-nums">{scope.sessions}개</p></div>
        <div className="flex min-h-[76px] flex-col items-center justify-center border-l border-white/10 px-2 py-3 text-center"><p className="text-[10px] font-medium text-white/65">분석 시간</p><p className="mt-1 text-base font-extrabold tabular-nums">{scope.drivingMinutes}분</p></div>
        <div className="flex min-h-[76px] flex-col items-center justify-center border-l border-white/10 px-2 py-3 text-center"><p className="text-[10px] font-medium text-white/65">주의 장면</p><p className="mt-1 text-base font-extrabold tabular-nums">{scope.hazardEvents}건</p></div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(300px,.78fr)_minmax(0,1.22fr)]">
        <article className="flex flex-col items-center rounded-2xl border border-line/90 bg-white p-6 shadow-[0_12px_34px_rgba(15,31,54,.05)]">
          <div className="w-full"><p className="text-xs font-semibold text-muted">대표 주의 장면 {scoredEvents.length}건</p><h2 className="mt-1 text-lg font-bold">평균 반응 점수</h2></div>
          <ScoreRing score={reactionScore} large />
          <p className="mt-2 text-xl font-extrabold">{reactionScore}점</p>
          <p className="mt-1 text-center text-xs text-muted">합성 데이터와 설정 {configVersion}로 계산한 임시 지표</p>
        </article>

        <article className="rounded-2xl border border-[#d7e4f5] bg-[linear-gradient(145deg,#f8fbff,#eef5ff)] p-5 shadow-[0_12px_34px_rgba(15,31,54,.04)] sm:p-6">
          <p className="text-[11px] font-bold tracking-[.13em] text-brand uppercase">점수 계산식</p>
          <h2 className="mt-2 text-xl font-extrabold">세 반응 점수의 평균</h2>
          <p className="mt-3 rounded-xl bg-white px-4 py-3 text-center text-sm font-bold leading-relaxed shadow-sm">
            (인지→해제 점수 + 페달 전환 점수 + 총 제동 반응 점수) ÷ 3
          </p>
          <dl className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-3"><dt className="text-[11px] font-semibold text-muted">인지→해제</dt><dd className="mt-1 text-xs font-bold">{settings.recognitionFullScoreMs}ms 이하 100점<br />{settings.recognitionZeroScoreMs.toLocaleString("ko-KR")}ms 이상 0점</dd></div>
            <div className="rounded-xl bg-white p-3"><dt className="text-[11px] font-semibold text-muted">페달 전환</dt><dd className="mt-1 text-xs font-bold">{settings.transitionFullScoreMs}ms 이하 100점<br />{settings.transitionZeroScoreMs}ms 이상 0점</dd></div>
            <div className="rounded-xl bg-white p-3"><dt className="text-[11px] font-semibold text-muted">총 제동 반응</dt><dd className="mt-1 text-xs font-bold">{settings.reactionFullScoreMs}ms 이하 100점<br />{settings.reactionZeroScoreMs.toLocaleString("ko-KR")}ms 이상 0점</dd></div>
          </dl>
          <p className="mt-3 text-[11px] leading-relaxed text-muted">두 기준 사이 값은 직선으로 환산합니다. 이 기준은 외부 안전기준이 아니라 파일럿 검증 전 제품 초기값입니다.</p>
          <Link href="/evidence" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-brand underline underline-offset-2">계산 근거와 출처 전체 보기 <ChevronIcon className="size-3" /></Link>
        </article>
      </section>

      <section>
        <div className="mb-3"><h2 className="text-lg font-bold">이번 분석에서 볼 세 가지</h2><p className="mt-1 text-xs text-muted">핵심 값만 남기고 원본 장면으로 바로 연결했습니다.</p></div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href={`/events?id=${slowestTransition.id}`} className="rounded-2xl border border-line/90 bg-white p-4 shadow-[0_8px_22px_rgba(15,31,54,.035)]">
            <p className="text-xs font-semibold text-muted">평균 페달 전환</p><p className="mt-2 text-2xl font-extrabold tabular-nums">{formatMs(averages.transitionMs)}</p><p className="mt-1 text-[11px] text-muted">가속 해제 → 브레이크 접촉</p>
          </Link>
          <Link href={`/events?id=${strongestDecel.id}`} className="rounded-2xl border border-line/90 bg-white p-4 shadow-[0_8px_22px_rgba(15,31,54,.035)]">
            <p className="text-xs font-semibold text-muted">급감속 후보</p><p className="mt-2 text-2xl font-extrabold tabular-nums">{scope.hardBrakes}건</p><p className="mt-1 text-[11px] text-muted">IMU {thresholds.hardBrakeG}g 이하 · 내부 기준</p>
          </Link>
          <Link href={overlapEvent ? `/events?id=${overlapEvent.id}` : "/events"} className="rounded-2xl border border-line/90 bg-white p-4 shadow-[0_8px_22px_rgba(15,31,54,.035)]">
            <p className="text-xs font-semibold text-muted">페달 중첩 대표 장면</p><p className="mt-2 text-2xl font-extrabold tabular-nums">{events.filter((event) => event.type === "overlap").length}건</p><p className="mt-1 text-[11px] text-muted">두 페달 입력이 겹친 재생 장면</p>
          </Link>
        </div>
      </section>

      <details className="group rounded-2xl border border-line/90 bg-white shadow-[0_8px_24px_rgba(15,31,54,.035)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 marker:hidden sm:px-6">
          <span><b className="block text-sm">사건별 점수 그래프 보기</b><span className="mt-1 block text-xs text-muted">{provenance.displayPeriod.label} · 기간 추세가 아니라 대표 사건별 점수입니다.</span></span>
          <span className="font-bold text-brand group-open:hidden">열기</span><span className="hidden font-bold text-brand group-open:inline">닫기</span>
        </summary>
        <div className="border-t border-line/80 p-5 sm:p-6">
          <LineChart labels={scoredEvents.map((event) => event.id)} series={scoreSeries} height={220} ariaLabel={`합성 주의 장면 ${scoredEvents.length}건의 반응 점수. 평균 ${reactionScore}점`} />
        </div>
      </details>

      <EvidenceDisclosure source={source} configVersion={configVersion} sessions={scope.sessions} events={scope.hazardEvents} seeds={provenance.sessionSeeds} sampleIntervalMs={provenance.sampleIntervalMs} formula={provenance.scoreFormula} limitation={provenance.limitation} />

      <p className="rounded-xl border border-[#f0dfc8] bg-[#fffaf3] px-4 py-3 text-xs leading-relaxed text-muted"><b className="text-ink">해석 주의:</b> 실제 운전자 평가가 아닌 합성 데이터 기반 연구·개발 지표입니다.</p>
    </>
  );
}
