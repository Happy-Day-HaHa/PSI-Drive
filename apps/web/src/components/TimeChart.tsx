"use client";

import type { PointerEvent } from "react";
import { useWidth } from "@/components/useWidth";

export type TimeSeries = {
  key: string;
  values: number[];
  color: string;
};

type Mark = { key: string; ms: number };

type Props = {
  dtMs: number;
  series: TimeSeries[];
  domain: [number, number];
  ticks: number[];
  height: number;
  title: string;
  ariaLabel: string;
  marks: Mark[];
  zeroMs: number;
  playheadMs: number;
  onScrub: (ms: number) => void;
  showMarkLabels?: boolean;
  showTimeAxis?: boolean;
  bands?: { from: number; to: number; color: string }[];
  highlightKey?: string | null;
};

const LEFT = 42;
const RIGHT = 12;
const MARK_LABEL_GAP = 31;
const MARK_LABEL_WIDTH = 26;

function labelPositions(marks: Mark[], toX: (ms: number) => number, minX: number, maxX: number) {
  const positioned = [...marks]
    .sort((a, b) => a.ms - b.ms)
    .map((mark) => ({ ...mark, markX: toX(mark.ms), labelX: Math.min(maxX, Math.max(minX, toX(mark.ms))) }));

  for (let index = 1; index < positioned.length; index += 1) {
    positioned[index].labelX = Math.max(positioned[index].labelX, positioned[index - 1].labelX + MARK_LABEL_GAP);
  }
  if (positioned.at(-1) && positioned.at(-1)!.labelX > maxX) positioned.at(-1)!.labelX = maxX;
  for (let index = positioned.length - 2; index >= 0; index -= 1) {
    positioned[index].labelX = Math.min(positioned[index].labelX, positioned[index + 1].labelX - MARK_LABEL_GAP);
  }
  return positioned;
}

export function TimeChart({ dtMs, series, domain, ticks, height, title, ariaLabel, marks, zeroMs, playheadMs, onScrub, showMarkLabels = false, showTimeAxis = false, bands = [], highlightKey = null }: Props) {
  const { ref, width } = useWidth(640);
  const count = series[0].values.length;
  const durationMs = (count - 1) * dtMs;
  const innerWidth = Math.max(width - LEFT - RIGHT, 40);
  const x = (ms: number) => LEFT + (ms / durationMs) * innerWidth;

  const labels = showMarkLabels ? labelPositions(marks, x, LEFT + MARK_LABEL_WIDTH / 2, width - RIGHT - MARK_LABEL_WIDTH / 2) : [];
  const top = showMarkLabels ? 30 : 6;
  const bottom = showTimeAxis ? 22 : 4;
  const fullHeight = height + top + bottom;
  const y = (value: number) => top + (1 - (value - domain[0]) / (domain[1] - domain[0])) * height;

  const path = (values: number[]) => {
    const parts: string[] = [];
    values.forEach((value, index) => {
      parts.push(`${index === 0 ? "M" : "L"}${x(index * dtMs).toFixed(1)} ${y(value).toFixed(1)}`);
    });
    return parts.join("");
  };

  const scrub = (event: PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === "touch" && event.type === "pointermove" && event.buttons === 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - bounds.left - LEFT) / innerWidth;
    onScrub(Math.round(Math.min(1, Math.max(0, ratio)) * durationMs));
  };

  const firstSecond = Math.ceil((0 - zeroMs) / 1000);
  const lastSecond = Math.floor((durationMs - zeroMs) / 1000);
  const seconds: number[] = [];
  for (let second = firstSecond; second <= lastSecond; second += 1) seconds.push(second);

  return (
    <div ref={ref}>
      <p className="mb-0.5 text-xs font-medium text-muted">{title}</p>
      <svg width={width} height={fullHeight} role="img" aria-label={ariaLabel} className="block max-w-full cursor-crosshair touch-pan-y" onPointerMove={scrub} onPointerDown={scrub}>
        {bands.map((band) => (
          <rect key={`${band.from}-${band.to}`} x={x(band.from)} y={top} width={Math.max(x(band.to) - x(band.from), 1)} height={height} fill={band.color} />
        ))}
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={LEFT} x2={width - RIGHT} y1={y(tick)} y2={y(tick)} stroke="var(--color-line)" />
            <text x={LEFT - 8} y={y(tick) + 4} textAnchor="end" className="fill-muted text-[11px] tabular-nums">
              {tick}
            </text>
          </g>
        ))}
        {marks.map((mark) => (
          <line
            key={mark.key}
            x1={x(mark.ms)}
            x2={x(mark.ms)}
            y1={top}
            y2={top + height}
            stroke={highlightKey === mark.key ? "var(--color-ink)" : "var(--color-muted)"}
            strokeOpacity={highlightKey === mark.key ? 0.9 : 0.35}
          />
        ))}
        {labels.map((mark) => {
          const active = highlightKey === mark.key;
          return (
            <g key={mark.key}>
              <line x1={mark.markX} x2={mark.labelX} y1={top} y2={21} stroke={active ? "var(--color-brand)" : "var(--color-line)"} />
              <rect x={mark.labelX - MARK_LABEL_WIDTH / 2} y={2} width={MARK_LABEL_WIDTH} height={18} rx={9} fill={active ? "var(--color-brand)" : "var(--color-canvas)"} stroke={active ? "var(--color-brand)" : "var(--color-line)"} />
              <text x={mark.labelX} y={15} textAnchor="middle" className={`text-[10px] font-bold ${active ? "fill-white" : "fill-muted"}`}>{mark.key}</text>
            </g>
          );
        })}
        {series.map((item) => (
          <path key={item.key} d={path(item.values)} fill="none" stroke={item.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {showTimeAxis &&
          seconds.map((second) => (
            <text key={second} x={x(zeroMs + second * 1000)} y={fullHeight - 6} textAnchor="middle" className="fill-muted text-[11px] tabular-nums">
              {second > 0 ? `+${second}` : second}초
            </text>
          ))}
        <line x1={x(playheadMs)} x2={x(playheadMs)} y1={top - 2} y2={top + height + 2} stroke="var(--color-ink)" strokeWidth="1.5" />
        {series.map((item) => {
          const index = Math.min(Math.round(playheadMs / dtMs), count - 1);
          return <circle key={item.key} cx={x(playheadMs)} cy={y(item.values[index])} r="4" fill={item.color} stroke="var(--color-card)" strokeWidth="2" />;
        })}
      </svg>
    </div>
  );
}
