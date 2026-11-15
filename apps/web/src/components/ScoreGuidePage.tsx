import Link from "next/link";
import { ChevronIcon } from "@/components/Icons";
import { HabitRadar } from "@/components/HabitRadar";
import { ScoreRing } from "@/components/ScoreRing";
import { PageHeader, SampleBadge } from "@/components/ui";
import { accumulatedHabitSummary } from "@/lib/habit-summary";
import { pedalSamples } from "@/lib/pedal";

export function ScoreGuidePage() {
  const summary = accumulatedHabitSummary;
  const scored = pedalSamples.events.filter((event) => event.score !== null);
  const reactionAverage = scored.reduce((sum, event) => sum + (event.score ?? 0), 0) / scored.length;
  const weightedTotal = summary.domains.reduce((sum, domain) => sum + domain.score * domain.weight, 0);

  return (
    <>
      <PageHeader title="점수 계산법" description="점수가 충분히 쌓인 상황을 가정해, 전체 운전 습관을 4개 영역으로 나누고 한 점수로 합치는 방식을 보여드립니다." action={<SampleBadge />} />

      <section className="grid overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#10223f,#173f73_60%,#246ce2)] text-white shadow-[0_18px_44px_rgba(17,49,92,.2)] lg:grid-cols-[.8fr_1.2fr]">
        <div className="flex flex-col items-center justify-center p-7 sm:p-9">
          <p className="text-xs font-bold tracking-[.13em] text-blue-200 uppercase">Accumulated driving score</p>
          <ScoreRing score={summary.overall} large />
          <p className="mt-1 text-4xl font-black">{summary.overall}<span className="ml-1 text-base text-white/60">점</span></p>
          <p className="mt-2 rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/75">점수가 쌓였다고 가정한 누적 시연 데이터</p>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 border-t border-white/10 p-6 text-center lg:border-t-0 lg:border-l">
          <div className="rounded-2xl bg-white/10 p-4"><p className="text-3xl font-black">{summary.drives}</p><p className="mt-1 text-xs text-white/65">누적 주행</p></div>
          <span className="text-xl text-white/35">→</span>
          <div className="rounded-2xl bg-white p-4 text-brand"><p className="text-3xl font-black">4</p><p className="mt-1 text-xs font-bold">습관 영역</p></div>
          <span className="text-xl text-white/35">→</span>
          <div className="rounded-2xl bg-white/10 p-4"><p className="text-3xl font-black">{summary.overall}</p><p className="mt-1 text-xs text-white/65">종합 점수</p></div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
        <article className="rounded-[28px] border border-line bg-white p-5 shadow-[0_12px_34px_rgba(15,31,54,.05)] sm:p-6">
          <p className="text-[11px] font-extrabold tracking-[.12em] text-brand uppercase">Habit balance</p>
          <h2 className="mt-1 text-xl font-extrabold">4개 영역을 함께 봅니다</h2>
          <HabitRadar domains={summary.domains} />
        </article>
        <div className="grid gap-3 sm:grid-cols-2">
          {summary.domains.map((domain) => (
            <article key={domain.key} className="rounded-2xl border border-line/90 p-5" style={{ backgroundColor: domain.soft }}>
              <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-extrabold" style={{ color: domain.color }}>{domain.label}</h3><p className="mt-2 text-xs leading-relaxed text-muted">{domain.description}</p></div><span className="text-3xl font-black tabular-nums" style={{ color: domain.color }}>{domain.score}</span></div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/80"><div className="h-full rounded-full" style={{ width: `${domain.score}%`, backgroundColor: domain.color }} /></div>
              <p className="mt-2 text-[10px] font-semibold text-muted">종합점수 반영 {Math.round(domain.weight * 100)}%</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] bg-navy p-5 text-white sm:p-7">
        <p className="text-[11px] font-extrabold tracking-[.12em] text-blue-200 uppercase">종합점수 계산</p>
        <h2 className="mt-2 text-xl font-extrabold">각 영역 점수에 가중치를 곱해 더합니다</h2>
        <p className="mt-5 text-lg font-extrabold leading-relaxed sm:text-2xl">64×35% + 78×20% + 74×25% + 82×20% = <span className="text-blue-200">{weightedTotal.toFixed(1)}</span> → <span className="text-3xl">{summary.overall}점</span></p>
        <p className="mt-4 text-xs leading-relaxed text-white/60">영역 점수와 가중치는 전체 화면의 동작을 보여주기 위한 프로토타입 가정입니다. 실제 구현 시 차량 신호 수집 범위와 검증 결과에 맞춰 확정해야 합니다.</p>
      </section>

      <section className="rounded-[28px] border border-line bg-white p-5 sm:p-7">
        <p className="text-[11px] font-extrabold tracking-[.12em] text-brand uppercase">영역별 입력값</p>
        <h2 className="mt-2 text-xl font-extrabold">전체 주행과 주요 장면을 함께 반영합니다</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-[#eef5ff] p-5"><b className="text-sm text-brand">위험 대응</b><p className="mt-2 text-xs leading-relaxed text-muted">보행자·선행차 감속 등 위험 장면에서 인지 후 가속 해제, 페달 전환, 전체 제동 반응 시간을 봅니다.</p></div>
          <div className="rounded-2xl bg-[#effaf5] p-5"><b className="text-sm text-[#16855b]">가속 부드러움</b><p className="mt-2 text-xs leading-relaxed text-muted">전체 주행의 가속 페달 변화와 급가속 빈도를 누적해 일관된 가속 습관을 봅니다.</p></div>
          <div className="rounded-2xl bg-[#fff1f3] p-5"><b className="text-sm text-alert">제동 부드러움</b><p className="mt-2 text-xs leading-relaxed text-muted">급감속 빈도, 브레이크 압력 상승, 일상 감속 장면을 누적해 제동 습관을 봅니다.</p></div>
          <div className="rounded-2xl bg-[#f5f0ff] p-5"><b className="text-sm text-[#7c3aed]">페달 조작</b><p className="mt-2 text-xs leading-relaxed text-muted">가속에서 제동으로 옮기는 시간과 두 페달 입력 중첩 장면을 누적해 조작 안정성을 봅니다.</p></div>
        </div>
      </section>

      <details className="group rounded-[28px] border border-line bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 marker:hidden sm:p-7">
          <span><b className="block text-base">위험 대응 64점 상세 계산 보기</b><span className="mt-1 block text-xs text-muted">현재 13개 장면 중 위험 대응 장면 8개의 평균입니다.</span></span>
          <span className="font-bold text-brand group-open:hidden">열기</span><span className="hidden font-bold text-brand group-open:inline">닫기</span>
        </summary>
        <div className="border-t border-line p-5 sm:p-7">
          <div className="flex flex-wrap gap-2">{scored.map((event) => <span key={event.id} className="rounded-full bg-[#eef5ff] px-3 py-1.5 text-xs font-bold text-brand">{event.id} · {event.score}점</span>)}</div>
          <p className="mt-5 text-base font-extrabold leading-relaxed">({scored.map((event) => event.score).join(" + ")}) ÷ {scored.length} = {reactionAverage.toFixed(3)} → <span className="text-2xl text-brand">64점</span></p>
          <p className="mt-3 text-xs leading-relaxed text-muted">나머지 5개 기록도 버리는 것이 아닙니다. 급가속·일상 감속·페달 중첩 기록은 각각 가속, 제동, 페달 조작 영역의 누적 입력으로 사용한다는 구조입니다.</p>
        </div>
      </details>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d7e5f8] bg-[#f5f9ff] p-5 sm:p-6">
        <div><p className="text-sm font-extrabold">개별 장면에서는 날짜·애니메이션·그래프 해석을 먼저 보여줍니다.</p><p className="mt-1 text-xs text-muted">더 깊은 수치는 필요할 때만 펼쳐볼 수 있습니다.</p></div>
        <Link href="/events" className="inline-flex items-center gap-1 rounded-xl bg-brand px-4 py-3 text-xs font-bold text-white">주행 기록 보기 <ChevronIcon className="size-3" /></Link>
      </section>
    </>
  );
}
