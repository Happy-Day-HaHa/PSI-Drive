import Link from "next/link";
import { ChevronIcon } from "@/components/Icons";
import { ScoreRing } from "@/components/ScoreRing";
import { PageHeader, SampleBadge } from "@/components/ui";
import { eventTypeLabels, pedalSamples } from "@/lib/pedal";

function mean(values: number[]) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function linearScore(value: number, full: number, zero: number) {
  return Math.max(0, Math.min(100, ((zero - value) / (zero - full)) * 100));
}

export function ScoreGuidePage() {
  const { events, settings } = pedalSamples;
  const scored = events.filter((event) => event.score !== null);
  const excluded = events.filter((event) => event.score === null);
  const scoreValues = scored.map((event) => event.score as number);
  const rawAverage = scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length;
  const score = mean(scoreValues);
  const pedestrianCount = scored.filter((event) => event.type === "pedestrian").length;
  const leadBrakeCount = scored.filter((event) => event.type === "lead_brake").length;
  const example = scored[0];
  const recognition = linearScore(example.metrics.recognitionMs ?? 0, settings.recognitionFullScoreMs, settings.recognitionZeroScoreMs);
  const transition = linearScore(example.metrics.transitionMs ?? 0, settings.transitionFullScoreMs, settings.transitionZeroScoreMs);
  const reaction = linearScore(example.metrics.totalReactionMs ?? 0, settings.reactionFullScoreMs, settings.reactionZeroScoreMs);

  return (
    <>
      <PageHeader title="점수 계산법" description="13개 주행 기록 가운데 어떤 장면이 점수에 들어가고, 64점이 어떻게 만들어졌는지 단계별로 보여드립니다." action={<SampleBadge />} />

      <section className="grid overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#10223f,#173f73_60%,#246ce2)] text-white shadow-[0_18px_44px_rgba(17,49,92,.2)] lg:grid-cols-[.8fr_1.2fr]">
        <div className="flex flex-col items-center justify-center p-7 sm:p-9">
          <p className="text-xs font-bold tracking-[.13em] text-blue-200 uppercase">Driving habit score</p>
          <ScoreRing score={score} large />
          <p className="mt-1 text-4xl font-black">{score}<span className="ml-1 text-base text-white/60">점</span></p>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 border-t border-white/10 p-6 text-center lg:border-t-0 lg:border-l">
          <div className="rounded-2xl bg-white/10 p-4"><p className="text-3xl font-black">{events.length}</p><p className="mt-1 text-xs text-white/65">전체 기록</p></div>
          <span className="text-xl text-white/35">→</span>
          <div className="rounded-2xl bg-white p-4 text-brand"><p className="text-3xl font-black">{scored.length}</p><p className="mt-1 text-xs font-bold">점수 반영</p></div>
          <span className="text-xl text-white/35">→</span>
          <div className="rounded-2xl bg-white/10 p-4"><p className="text-3xl font-black">{score}</p><p className="mt-1 text-xs text-white/65">최종 평균</p></div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-[#d7e5f8] bg-[#f5f9ff] p-5 sm:p-6">
          <p className="text-[11px] font-extrabold tracking-[.12em] text-brand uppercase">점수에 포함</p>
          <h2 className="mt-2 text-xl font-extrabold">위험 대응 장면 {scored.length}개</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">보행자 대응 {pedestrianCount}개와 선행차 감속 대응 {leadBrakeCount}개입니다. 위험을 확인한 뒤 브레이크에 닿기까지의 반응을 계산합니다.</p>
          <div className="mt-4 flex flex-wrap gap-2">{scored.map((event) => <span key={event.id} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand shadow-sm">{event.id} · {event.score}점</span>)}</div>
        </article>
        <article className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <p className="text-[11px] font-extrabold tracking-[.12em] text-muted uppercase">점수에서 제외</p>
          <h2 className="mt-2 text-xl font-extrabold">관찰 장면 {excluded.length}개</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">급가속·페달 중첩·일상 감속은 위험 출현 시점 T0가 없어 같은 반응식으로 비교하지 않습니다.</p>
          <div className="mt-4 flex flex-wrap gap-2">{excluded.map((event) => <span key={event.id} className="rounded-full bg-canvas px-3 py-1.5 text-xs font-bold text-muted">{event.id} · {eventTypeLabels[event.type]}</span>)}</div>
        </article>
      </section>

      <section className="rounded-[28px] border border-line bg-white p-5 shadow-[0_12px_34px_rgba(15,31,54,.05)] sm:p-7">
        <p className="text-[11px] font-extrabold tracking-[.12em] text-brand uppercase">1. 세 가지 반응 시간</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-[#eef5ff] p-5"><p className="text-xs font-bold text-brand">인지 → 가속 해제</p><p className="mt-3 text-2xl font-black">{settings.recognitionFullScoreMs}–{settings.recognitionZeroScoreMs.toLocaleString("ko-KR")}<span className="ml-1 text-sm text-muted">ms</span></p><p className="mt-2 text-xs text-muted">빠를수록 높은 점수</p></div>
          <div className="rounded-2xl bg-[#fff7ed] p-5"><p className="text-xs font-bold text-caution">페달 전환</p><p className="mt-3 text-2xl font-black">{settings.transitionFullScoreMs}–{settings.transitionZeroScoreMs}<span className="ml-1 text-sm text-muted">ms</span></p><p className="mt-2 text-xs text-muted">가속 해제 → 브레이크 접촉</p></div>
          <div className="rounded-2xl bg-[#fff1f3] p-5"><p className="text-xs font-bold text-alert">전체 제동 반응</p><p className="mt-3 text-2xl font-black">{settings.reactionFullScoreMs}–{settings.reactionZeroScoreMs.toLocaleString("ko-KR")}<span className="ml-1 text-sm text-muted">ms</span></p><p className="mt-2 text-xs text-muted">위험 확인 → 브레이크 접촉</p></div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted">각 범위의 빠른 끝은 100점, 느린 끝은 0점이며 그 사이는 직선으로 환산합니다.</p>
      </section>

      <section className="rounded-[28px] bg-navy p-5 text-white sm:p-7">
        <p className="text-[11px] font-extrabold tracking-[.12em] text-blue-200 uppercase">2. 장면 점수 예시 · {example.id}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-center">
          <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-white/60">인지 점수</p><p className="mt-2 text-2xl font-black">{recognition.toFixed(1)}</p></div>
          <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-white/60">전환 점수</p><p className="mt-2 text-2xl font-black">{transition.toFixed(1)}</p></div>
          <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-white/60">전체 반응 점수</p><p className="mt-2 text-2xl font-black">{reaction.toFixed(1)}</p></div>
          <div className="rounded-2xl bg-white px-6 py-4 text-center text-brand"><p className="text-xs font-bold">세 점수 평균</p><p className="mt-1 text-3xl font-black">{example.score}점</p></div>
        </div>
      </section>

      <section className="rounded-[28px] border border-line bg-white p-5 sm:p-7">
        <p className="text-[11px] font-extrabold tracking-[.12em] text-brand uppercase">3. 최종 평균</p>
        <p className="mt-3 text-lg font-extrabold leading-relaxed">({scored.map((event) => event.score).join(" + ")}) ÷ {scored.length} = {rawAverage.toFixed(3)} → <span className="text-3xl text-brand">{score}점</span></p>
        <p className="mt-3 text-xs leading-relaxed text-muted">현재 점수는 위험 대응 반응을 보여주는 합성 데이터용 지수입니다. 급가속·페달 중첩·일상 감속은 별도 장면으로 보여주지만 점수에는 넣지 않습니다.</p>
        <Link href="/events" className="mt-5 inline-flex items-center gap-1 rounded-xl bg-brand px-4 py-3 text-xs font-bold text-white">13개 주행 기록 보기 <ChevronIcon className="size-3" /></Link>
      </section>
    </>
  );
}
