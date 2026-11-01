"use client";

import { useState } from "react";
import type { ReactionPhase } from "@/lib/sample-data";

// 칸이 이보다 좁으면 숫자를 칸 안에 넣지 않고 툴팁과 표로 보여 준다.
const MIN_LABEL_SHARE = 0.14;

export function ReactionBar({ phases }: { phases: ReactionPhase[] }) {
  const [active, setActive] = useState<string | null>(null);
  const total = phases.reduce((sum, phase) => sum + phase.ms, 0);
  const activePhase = phases.find((phase) => phase.key === active);

  return (
    <div>
      <div className="relative">
        <div
          className="flex h-7 gap-0.5"
          role="img"
          aria-label={`사건 반응 시간 구성: ${phases.map((phase) => `${phase.label} ${phase.ms}ms`).join(", ")}`}
        >
          {phases.map((phase) => (
            <div
              key={phase.key}
              tabIndex={0}
              className="flex items-center rounded px-2 text-xs font-bold tabular-nums whitespace-nowrap outline-offset-1 outline-ink transition-opacity focus-visible:outline-2"
              style={{
                width: `${(phase.ms / total) * 100}%`,
                background: phase.color,
                color: phase.onColor,
                opacity: active && active !== phase.key ? 0.45 : 1,
              }}
              onPointerEnter={() => setActive(phase.key)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(phase.key)}
              onBlur={() => setActive(null)}
            >
              {phase.ms / total >= MIN_LABEL_SHARE ? `${phase.ms}ms` : ""}
            </div>
          ))}
        </div>
        {activePhase && (
          <div className="pointer-events-none absolute top-9 left-0 z-10 rounded-xl bg-navy px-3 py-2 text-xs text-white shadow-lg">
            <span className="font-bold tabular-nums">{activePhase.ms}ms</span>
            <span className="ml-1.5 text-white/75">
              {activePhase.label} · {Math.round((activePhase.ms / total) * 100)}%
            </span>
          </div>
        )}
      </div>
      <ul className="mt-3.5 grid gap-x-5 gap-y-1.5 text-[13px] text-muted sm:grid-cols-2">
        {phases.map((phase) => (
          <li key={phase.key} className="flex items-center gap-2">
            <span aria-hidden className="size-2.5 shrink-0 rounded-[3px]" style={{ background: phase.color }} />
            {phase.label}
            <span className="text-xs text-muted/80">{phase.span}</span>
          </li>
        ))}
      </ul>
      <details className="mt-2 text-sm text-muted">
        <summary className="w-fit cursor-pointer rounded text-xs outline-brand focus-visible:outline-2">표로 보기</summary>
        <table className="mt-2 w-full text-left text-xs tabular-nums">
          <thead>
            <tr>
              <th scope="col" className="py-1 pr-3 font-medium">단계</th>
              <th scope="col" className="py-1 pr-3 font-medium">구간</th>
              <th scope="col" className="py-1 font-medium">평균 시간</th>
            </tr>
          </thead>
          <tbody>
            {phases.map((phase) => (
              <tr key={phase.key} className="border-t border-line text-ink">
                <th scope="row" className="py-1 pr-3 font-normal">{phase.label}</th>
                <td className="py-1 pr-3">{phase.span}</td>
                <td className="py-1">{phase.ms}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
