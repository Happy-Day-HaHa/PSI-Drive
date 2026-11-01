"use client";

import { useEffect, useRef } from "react";
import { PauseIcon, PinIcon, PlayIcon } from "@/components/Icons";
import { MobilePedalSync } from "@/components/MobilePedalSync";
import { eventLocation, eventTypeLabels, formatMs, stepInfo, type PedalEvent } from "@/lib/pedal";

type Mark = PedalEvent["marks"][number];

const markTone: Record<string, { dot: string; chip: string; label: string }> = {
  T0: { dot: "bg-caution", chip: "bg-caution-soft text-caution", label: "상황 확인" },
  T1: { dot: "bg-data", chip: "bg-[#eaf2fd] text-data", label: "가속 해제" },
  T2: { dot: "bg-data", chip: "bg-[#eaf2fd] text-data", label: "가속 해제" },
  T3: { dot: "bg-[#e8863a]", chip: "bg-[#fff2e7] text-[#a94e08]", label: "발 이동" },
  T4: { dot: "bg-alert", chip: "bg-[#feecef] text-alert", label: "브레이크" },
  T5: { dot: "bg-alert", chip: "bg-[#feecef] text-alert", label: "브레이크" },
  T6: { dot: "bg-good", chip: "bg-good-soft text-good", label: "차량 반응" },
  T7: { dot: "bg-[#94a3b8]", chip: "bg-canvas text-muted", label: "마무리" },
  O0: { dot: "bg-[#7c3aed]", chip: "bg-[#f1eafe] text-[#6d28d9]", label: "동시 입력" },
  O1: { dot: "bg-[#7c3aed]", chip: "bg-[#f1eafe] text-[#6d28d9]", label: "동시 입력" },
};

export function MobileDriveWorkspace({
  event,
  accel,
  brake,
  foot,
  playheadMs,
  durationMs,
  elapsed,
  playing,
  rate,
  steps,
  activeKey,
  selectedKey,
  onToggle,
  onScrub,
  onRate,
  onJump,
}: {
  event: PedalEvent;
  accel: number;
  brake: number;
  foot: number;
  playheadMs: number;
  durationMs: number;
  elapsed: number;
  playing: boolean;
  rate: number;
  steps: Mark[];
  activeKey: string | null;
  selectedKey: string | null;
  onToggle: () => void;
  onScrub: (ms: number) => void;
  onRate: (rate: number) => void;
  onJump: (key: string, ms: number) => void;
}) {
  const visibleKey = selectedKey ?? activeKey;
  const rows = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    if (!visibleKey) return;
    rows.current.get(visibleKey)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [visibleKey]);

  return (
    <section id="drive-workspace" className="sticky top-[72px] z-10 grid h-[calc(100dvh-9.25rem)] min-h-[520px] scroll-mt-[72px] grid-rows-[auto_auto_auto_minmax(0,1fr)] overflow-hidden rounded-[22px] border border-[#203c61] bg-[#091a30] shadow-[0_22px_52px_rgba(5,20,39,.24)] xl:hidden">
      <header className="flex items-start justify-between gap-3 border-b border-white/10 bg-[linear-gradient(120deg,#0b203b,#173f73)] px-4 py-3 text-white">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-300/15 px-2 py-0.5 text-[9px] font-bold tracking-[.13em] text-blue-200 uppercase">PSI Motion Lens</span>
            <span className="text-[10px] text-white/45">{event.id}</span>
          </div>
          <h2 className="mt-1.5 truncate text-base font-bold">{eventTypeLabels[event.type]}</h2>
          <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-white/60">
            <PinIcon className="size-3 shrink-0 text-blue-300" />{eventLocation(event)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] text-white/50">{event.date}</p>
          <p className="mt-0.5 text-xs font-semibold">{event.time}</p>
          {event.score !== null && <span className="mt-1 inline-block rounded-md bg-white/10 px-2 py-0.5 text-xs font-bold">{event.score}점</span>}
        </div>
      </header>

      <div className="min-h-0 bg-[#eef3f8] p-2.5">
        <MobilePedalSync
          accel={accel}
          brake={brake}
          foot={foot}
          accelSeries={event.series.accel}
          brakeSeries={event.series.brake}
          playheadMs={playheadMs}
          durationMs={durationMs}
          stepLabel={activeKey ? `${activeKey} · ${stepInfo[activeKey].title}` : "장면 직전 주행"}
        />
      </div>

      <div className="border-y border-white/8 bg-[#0d223e] px-3 py-2.5 text-white">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-navy shadow-[0_5px_16px_rgba(0,0,0,.2)]"
            aria-label={playing ? "일시정지" : "재생"}
          >
            {playing ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={durationMs}
            step={1}
            value={Math.round(playheadMs)}
            onChange={(input) => onScrub(Number(input.target.value))}
            className="min-w-0 flex-1 accent-[#6da8ff]"
            aria-label="발 움직임 재생 위치"
          />
          <span className="w-[66px] text-right text-[11px] font-bold text-blue-200 tabular-nums">{elapsed >= 0 ? "+" : "−"}{Math.abs(elapsed)}ms</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[10px] text-white/45">발·가속·브레이크가 같은 시간축으로 움직여요</p>
          <div className="flex rounded-md bg-white/8 p-0.5">
            {[0.25, 0.5, 1].map((value) => (
              <button key={value} type="button" onClick={() => onRate(value)} className={`rounded px-2 py-1 text-[9px] font-bold ${rate === value ? "bg-white text-navy" : "text-white/55"}`}>{value}×</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] bg-white">
        <div className="flex items-center justify-between border-b border-line/80 px-4 py-2.5">
          <div>
            <h3 className="text-sm font-bold">이 장면의 시간 흐름</h3>
            <p className="mt-0.5 text-[10px] text-muted">단계를 누르면 해당 시점으로 바로 이동해요.</p>
          </div>
          <span className="rounded-full bg-[#eef4fb] px-2 py-1 text-[10px] font-bold text-brand">{steps.length}단계</span>
        </div>
        <ol className="timeline-scroll min-h-0 overflow-y-auto overscroll-contain px-2 py-1.5">
          {steps.map((mark, index) => {
            const info = stepInfo[mark.key];
            const tone = markTone[mark.key] ?? markTone.T7;
            const active = visibleKey === mark.key;
            const previous = steps[index - 1];
            return (
              <li key={mark.key} className="relative pl-5">
                {index < steps.length - 1 && <span aria-hidden className="absolute top-7 bottom-[-10px] left-[9px] w-px bg-line" />}
                <span aria-hidden className={`absolute top-[22px] left-[5px] size-[9px] rounded-full ring-4 ring-white ${active ? tone.dot : "bg-[#cbd5e1]"}`} />
                <button
                  ref={(node) => {
                    if (node) rows.current.set(mark.key, node);
                    else rows.current.delete(mark.key);
                  }}
                  type="button"
                  onClick={() => onJump(mark.key, mark.ms)}
                  aria-current={active ? "step" : undefined}
                  className={`mb-1 grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${active ? "border-brand bg-[#eef5fd] shadow-[0_5px_16px_rgba(23,63,115,.08)]" : "border-transparent bg-white active:bg-canvas"}`}
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${tone.chip}`}>{tone.label}</span>
                      <b className="truncate text-xs">{mark.key} · {info.title}</b>
                    </span>
                    <span className="mt-1 block truncate text-[10px] text-muted">{info.body}</span>
                  </span>
                  <span className="text-right">
                    <b className={`block text-xs tabular-nums ${active ? "text-brand" : "text-ink"}`}>{formatMs(mark.ms)}</b>
                    {previous && <span className="mt-0.5 block text-[9px] text-muted">+{formatMs(mark.ms - previous.ms)}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
