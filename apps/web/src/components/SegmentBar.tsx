"use client";

import { useState } from "react";

export type Segment = {
  key: string;
  label: string;
  value: number;
  color: string;
  onColor: string;
  note?: string;
};

// 칸이 이보다 좁으면 숫자를 칸 안에 넣지 않고 툴팁과 범례로 보여 준다.
const MIN_LABEL_SHARE = 0.13;

export function SegmentBar({ segments, unit, ariaLabel }: { segments: Segment[]; unit: string; ariaLabel: string }) {
  const [active, setActive] = useState<string | null>(null);
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const activeSegment = segments.find((segment) => segment.key === active);

  return (
    <div>
      <div className="relative">
        <div className="flex h-7 gap-0.5" role="img" aria-label={`${ariaLabel}: ${segments.map((segment) => `${segment.label} ${segment.value}${unit}`).join(", ")}`}>
          {segments.map((segment) => (
            <div
              key={segment.key}
              tabIndex={0}
              className="flex items-center rounded px-2 text-xs font-bold whitespace-nowrap tabular-nums outline-offset-1 outline-ink transition-opacity focus-visible:outline-2"
              style={{
                width: `${(segment.value / total) * 100}%`,
                background: segment.color,
                color: segment.onColor,
                opacity: active && active !== segment.key ? 0.45 : 1,
                padding: segment.value / total < 0.03 ? 0 : undefined,
              }}
              onPointerEnter={() => setActive(segment.key)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(segment.key)}
              onBlur={() => setActive(null)}
            >
              {segment.value / total >= MIN_LABEL_SHARE ? `${segment.value}${unit}` : ""}
            </div>
          ))}
        </div>
        {activeSegment && (
          <div className="pointer-events-none absolute top-9 left-0 z-10 rounded-md bg-navy px-3 py-2 text-xs text-white shadow-md">
            <span className="font-bold tabular-nums">
              {activeSegment.value}
              {unit}
            </span>
            <span className="ml-1.5 text-white/75">{activeSegment.label}</span>
          </div>
        )}
      </div>
      <ul className="mt-3 grid gap-x-5 gap-y-1.5 text-[13px] sm:grid-cols-2">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-2">
            <span aria-hidden className="size-2.5 shrink-0 rounded-[3px]" style={{ background: segment.color }} />
            <span className="text-muted">{segment.label}</span>
            {segment.note && <span className="text-xs text-muted/80">{segment.note}</span>}
            <span className="ml-auto font-semibold tabular-nums">
              {segment.value}
              {unit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
