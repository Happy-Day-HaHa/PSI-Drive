"use client";

import { useState } from "react";

type Bin = { label: string; value: number };

type Props = {
  bins: Bin[];
  color: string;
  valueSuffix: string;
  xTitle: string;
  ariaLabel: string;
  format?: (value: number) => string;
};

export function Histogram({ bins, color, valueSuffix, xTitle, ariaLabel, format = (value) => `${value}` }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...bins.map((bin) => bin.value), 1);
  const peak = bins.findIndex((bin) => bin.value === max);
  return (
    <div>
      <div className="flex h-[170px] items-end gap-0.5 border-b border-line" role="group" aria-label={ariaLabel}>
        {bins.map((bin, index) => {
          const showValue = index === peak || index === active;
          return (
            <div
              key={bin.label}
              tabIndex={0}
              aria-label={`${bin.label}: ${format(bin.value)}${valueSuffix}`}
              className="flex h-full min-w-0 flex-1 cursor-default flex-col items-center justify-end rounded-t outline-offset-1 outline-brand transition-colors hover:bg-canvas focus-visible:outline-2"
              onPointerEnter={() => setActive(index)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
            >
              {showValue && (
                <span className="mb-1 text-xs font-bold whitespace-nowrap tabular-nums">
                  {format(bin.value)}
                  {valueSuffix}
                </span>
              )}
              <div
                className="w-full max-w-6 rounded-t transition-opacity"
                style={{
                  height: `${(bin.value / max) * 82}%`,
                  minHeight: bin.value > 0 ? 3 : 0,
                  background: color,
                  opacity: active !== null && active !== index ? 0.55 : 1,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-0.5">
        {bins.map((bin) => (
          <span key={bin.label} className="min-w-0 flex-1 text-center text-[11px] leading-tight text-muted">
            {bin.label}
          </span>
        ))}
      </div>
      <p className="mt-1 text-center text-xs text-muted">{xTitle}</p>
    </div>
  );
}
