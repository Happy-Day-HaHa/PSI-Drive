import Link from "next/link";
import { ChevronIcon } from "@/components/Icons";
import type { PedalEvent } from "@/lib/pedal";
import type { SubScore } from "@/lib/sample-data";

const explanation: Record<string, { cause: string; cta: string; href: string; color: string }> = {
  responsiveness: {
    cause: "가속 해제 후 브레이크 접촉이 기준보다 느린 사건이 있었습니다.",
    cta: "가장 큰 감점 사건 보기",
    href: "/events",
    color: "#e8863a",
  },
  braking: {
    cause: "브레이크 접촉 후 제동력 상승이 다소 늦었던 구간이 반영됐습니다.",
    cta: "제동 과정 확인하기",
    href: "/events",
    color: "#c23343",
  },
  safety: {
    cause: "짧은 페달 중첩 1건이 감지됐지만 전체 영향은 낮았습니다.",
    cta: "중첩 사건 확인하기",
    href: "/events",
    color: "#7c3aed",
  },
  smoothness: {
    cause: "급가속 3회와 가속 압력 변동이 점수에 반영됐습니다.",
    cta: "페달 습관 확인하기",
    href: "/pedal",
    color: "#2672d8",
  },
};

function eventLink(key: string, events: PedalEvent[]) {
  if (key === "responsiveness") {
    const event = [...events]
      .filter((item) => item.metrics.transitionMs !== undefined)
      .sort((a, b) => (b.metrics.transitionMs ?? 0) - (a.metrics.transitionMs ?? 0))[0];
    return event ? `/events?id=${event.id}` : "/events";
  }
  if (key === "braking") {
    const event = [...events]
      .filter((item) => item.metrics.riseMs !== undefined)
      .sort((a, b) => (b.metrics.riseMs ?? 0) - (a.metrics.riseMs ?? 0))[0];
    return event ? `/events?id=${event.id}` : "/events";
  }
  if (key === "safety") {
    const event = events.find((item) => item.type === "overlap");
    return event ? `/events?id=${event.id}` : "/events";
  }
  return explanation[key]?.href ?? "/";
}

export function ScoreExplanation({ score, subScores, events }: { score: number; subScores: SubScore[]; events: PedalEvent[] }) {
  const deduction = Math.round((100 - score) * 10) / 10;
  return (
    <section className="overflow-hidden rounded-2xl border border-line/90 bg-card shadow-[0_12px_32px_rgba(15,31,54,0.04)]">
      <div className="grid border-b border-line/80 md:grid-cols-[minmax(0,1fr)_240px]">
        <div className="p-5 sm:p-6">
          <p className="text-[11px] font-bold tracking-[0.14em] text-brand uppercase">Score explanation</p>
          <h2 className="mt-1.5 text-xl font-bold tracking-tight">내 점수는 왜 {score}점인가요?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            100점에서 각 항목의 기준 미달분과 가중치를 적용해 총 {deduction}점이 조정됐습니다. 항목을 누르면 실제 사건과 발 움직임까지 바로 확인할 수 있습니다.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-[#f7f9fc] px-5 py-4 md:justify-center md:border-l md:border-line/80">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-bold text-white shadow-[0_8px_20px_rgba(23,63,115,0.18)]">{score}</div>
          <div>
            <p className="text-xs text-muted">기준 점수</p>
            <p className="mt-0.5 font-semibold tabular-nums">100 − {deduction} = {score}점</p>
          </div>
        </div>
      </div>

      <ol className="divide-y divide-line/80">
        {subScores.map((item) => {
          const info = explanation[item.key];
          const points = ((100 - item.score) * item.weight) / 100;
          return (
            <li key={item.key}>
              <Link
                href={eventLink(item.key, events)}
                className="group grid gap-3 px-5 py-4 transition-colors hover:bg-[#f8fafc] sm:grid-cols-[150px_minmax(0,1fr)_90px] sm:items-center sm:px-6"
              >
                <span className="flex items-center gap-3">
                  <span className="size-2.5 rounded-full" style={{ background: info.color }} />
                  <span>
                    <span className="block text-sm font-bold">{item.label}</span>
                    <span className="block text-[11px] text-muted">비중 {item.weight}%</span>
                  </span>
                </span>
                <span>
                  <span className="block text-[13px] leading-relaxed text-ink">{info.cause}</span>
                  <span className="mt-1 inline-flex items-center gap-0.5 text-xs font-semibold text-brand group-hover:underline">
                    {info.cta}<ChevronIcon className="size-3" />
                  </span>
                </span>
                <span className="flex items-center justify-between sm:block sm:text-right">
                  <span className="text-xs text-muted sm:block">{item.score}점</span>
                  <span className="text-sm font-bold text-alert tabular-nums">−{points.toFixed(1)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <div className="grid grid-cols-3 border-t border-line/80 bg-[#fbfcfe] text-center text-[11px] text-muted">
        <div className="px-2 py-3"><b className="mr-1 text-brand">1</b>감점 원인 선택</div>
        <div className="border-x border-line/80 px-2 py-3"><b className="mr-1 text-brand">2</b>사건·시점 확인</div>
        <div className="px-2 py-3"><b className="mr-1 text-brand">3</b>발·압력 과정 재생</div>
      </div>
    </section>
  );
}
