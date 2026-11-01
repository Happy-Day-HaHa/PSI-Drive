"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

export type Series = {
  name: string;
  values: number[];
  color: string;
  emphasized?: boolean;
};

type Props = {
  labels: string[];
  series: Series[];
  height?: number;
  ariaLabel: string;
};

const DOMAIN: [number, number] = [40, 100];
const TICKS = [40, 60, 80, 100];
const PADDING = { top: 14, right: 34, bottom: 28, left: 34 };

export function LineChart({ labels, series, height = 210, ariaLabel }: Props) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(520);
  const [active, setActive] = useState<number | null>(null);
  const gradientId = useId();

  useEffect(() => {
    const element = wrapper.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const innerWidth = Math.max(width - PADDING.left - PADDING.right, 40);
  const innerHeight = height - PADDING.top - PADDING.bottom;
  const x = (index: number) =>
    PADDING.left + (labels.length > 1 ? (index / (labels.length - 1)) * innerWidth : innerWidth / 2);
  const y = (value: number) =>
    PADDING.top + (1 - (value - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0])) * innerHeight;
  const linePath = (values: number[]) =>
    values.map((value, index) => `${index === 0 ? "M" : "L"}${x(index)} ${y(value)}`).join(" ");

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - bounds.left - PADDING.left) / innerWidth;
    setActive(Math.min(labels.length - 1, Math.max(0, Math.round(ratio * (labels.length - 1)))));
  };

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key === "ArrowRight") setActive((current) => Math.min(labels.length - 1, (current ?? -1) + 1));
    if (event.key === "ArrowLeft") setActive((current) => Math.max(0, (current ?? labels.length) - 1));
  };

  const primary = series.find((item) => item.emphasized) ?? series[0];
  const lastIndex = labels.length - 1;
  const tooltipLeft = active === null ? 0 : Math.min(Math.max(x(active), 66), width - 66);

  return (
    <div>
      <div ref={wrapper} className="relative">
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          className="block max-w-full touch-pan-y rounded-lg outline-brand focus-visible:outline-2"
          onPointerMove={onPointerMove}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(lastIndex)}
          onBlur={() => setActive(null)}
          onKeyDown={onKeyDown}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={primary.color} stopOpacity="0.14" />
              <stop offset="1" stopColor={primary.color} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {TICKS.map((tick) => (
            <g key={tick}>
              <line x1={PADDING.left} x2={width - PADDING.right} y1={y(tick)} y2={y(tick)} stroke="var(--color-line)" />
              <text x={PADDING.left - 10} y={y(tick) + 4} textAnchor="end" className="fill-muted text-xs tabular-nums">
                {tick}
              </text>
            </g>
          ))}
          {labels.map((label, index) => (
            <text
              key={label}
              x={x(index)}
              y={height - 7}
              textAnchor={index === 0 ? "start" : index === lastIndex ? "end" : "middle"}
              className="fill-muted text-xs"
            >
              {label}
            </text>
          ))}
          <path
            d={`${linePath(primary.values)} L${x(lastIndex)} ${y(DOMAIN[0])} L${x(0)} ${y(DOMAIN[0])} Z`}
            fill={`url(#${gradientId})`}
          />
          {series.map((item) => (
            <path
              key={item.name}
              d={linePath(item.values)}
              fill="none"
              stroke={item.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {active !== null && (
            <line x1={x(active)} x2={x(active)} y1={PADDING.top} y2={y(DOMAIN[0])} stroke="var(--color-muted)" strokeOpacity="0.45" />
          )}
          {series.map((item) =>
            item.values.map((value, index) => (
              <circle
                key={`${item.name}-${index}`}
                cx={x(index)}
                cy={y(value)}
                r={active === index ? 5.5 : 4}
                fill={item.color}
                stroke="var(--color-card)"
                strokeWidth="2"
              />
            )),
          )}
          <text
            x={x(lastIndex) + 9}
            y={y(primary.values[lastIndex]) + 4}
            className="fill-ink text-xs font-bold tabular-nums"
          >
            {primary.values[lastIndex]}
          </text>
        </svg>
        {active !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-[124px] -translate-x-1/2 rounded-xl bg-navy px-3 py-2 text-white shadow-lg"
            style={{ left: tooltipLeft }}
          >
            <p className="text-xs text-white/70">{labels[active]}</p>
            {series.map((item) => (
              <p key={item.name} className="mt-1 flex items-center gap-1.5 text-xs">
                <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: item.emphasized ? "#8fb4ff" : "#c3cede" }} />
                <span className="font-bold tabular-nums">{item.values[active]}</span>
                <span className="truncate text-white/75">{item.name}</span>
              </p>
            ))}
          </div>
        )}
      </div>
      <details className="mt-1 text-sm text-muted">
        <summary className="w-fit cursor-pointer rounded text-xs outline-brand focus-visible:outline-2">표로 보기</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-xs tabular-nums">
            <thead>
              <tr>
                <th scope="col" className="py-1 pr-3 font-medium">구간</th>
                {series.map((item) => (
                  <th key={item.name} scope="col" className="py-1 pr-3 font-medium">{item.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((label, index) => (
                <tr key={label} className="border-t border-line text-ink">
                  <th scope="row" className="py-1 pr-3 font-normal">{label}</th>
                  {series.map((item) => (
                    <td key={item.name} className="py-1 pr-3">{item.values[index]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export function ChartLegend({ series }: { series: Series[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
      {series.map((item) => (
        <li key={item.name} className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-full" style={{ background: item.color }} />
          {item.name}
        </li>
      ))}
    </ul>
  );
}
