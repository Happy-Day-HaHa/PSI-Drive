"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { EventDetail } from "@/components/EventDetail";
import { PinIcon } from "@/components/Icons";
import { PedalEventIcon, pedalActionLabel } from "@/components/PedalEventIcon";
import { PageHeader, SampleBadge } from "@/components/ui";
import { eventLocation, eventTypeLabels, formatMs, pedalSamples, type EventType, type PedalEvent } from "@/lib/pedal";

const filters: { key: EventType | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "pedestrian", label: eventTypeLabels.pedestrian },
  { key: "lead_brake", label: eventTypeLabels.lead_brake },
  { key: "routine", label: eventTypeLabels.routine },
  { key: "overlap", label: eventTypeLabels.overlap },
];

function keyFigure(event: PedalEvent) {
  if (event.type === "overlap") return `중첩 ${formatMs(event.metrics.overlapMs ?? 0)}`;
  if (event.type === "routine") return `최대 제동 ${Math.round(event.stats.peakBrakePct)}%`;
  return `페달 전환 ${formatMs(event.metrics.transitionMs ?? 0)}`;
}

function eventLevel(event: PedalEvent) {
  if (event.type === "overlap") return { label: "확인", className: "bg-[#f1eafe] text-[#6d28d9]" };
  if (event.score !== null && event.score < 70) return { label: "주의", className: "bg-[#feecef] text-alert" };
  if (event.score !== null && event.score < 85) return { label: "살펴보기", className: "bg-caution-soft text-caution" };
  return { label: "안정", className: "bg-good-soft text-good" };
}

export function EventsExplorer() {
  const router = useRouter();
  const params = useSearchParams();
  const [filter, setFilter] = useState<EventType | "all">("all");
  const mobileStrip = useRef<HTMLUListElement>(null);
  const mobileEventButtons = useRef(new Map<string, HTMLButtonElement>());
  const events = pedalSamples.events;
  const visible = useMemo(() => (filter === "all" ? events : events.filter((event) => event.type === filter)), [events, filter]);
  const selected = events.find((event) => event.id === params.get("id")) ?? events.find((event) => event.type === "pedestrian") ?? events[0];

  const select = (id: string) => {
    router.replace(`/events?id=${id}`, { scroll: false });
  };

  useEffect(() => {
    const container = mobileStrip.current;
    const target = mobileEventButtons.current.get(selected.id);
    if (!container || !target) return;
    const nextLeft = target.offsetLeft - container.clientWidth / 2 + target.offsetWidth / 2;
    container.scrollTo({ left: Math.max(0, nextLeft), behavior: "smooth" });
  }, [selected.id]);

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2 xl:block xl:h-auto xl:space-y-5">
      <nav aria-label="모바일 주행 장면 선택" className="mobile-event-strip min-w-0 xl:hidden">
        <ul ref={mobileStrip} className="event-strip-scroll flex gap-1.5 overflow-x-auto pb-0.5">
          {events.map((event) => {
            const active = event.id === selected.id;
            const level = eventLevel(event);
            return (
              <li key={event.id} className="shrink-0">
                <button
                  ref={(node) => {
                    if (node) mobileEventButtons.current.set(event.id, node);
                    else mobileEventButtons.current.delete(event.id);
                  }}
                  type="button"
                  aria-current={active ? "true" : undefined}
                  aria-label={`${eventTypeLabels[event.type]}, ${event.date} ${event.time}, ${eventLocation(event)}`}
                  onClick={() => select(event.id)}
                  className={`relative flex h-11 items-center gap-2 rounded-xl border px-3 text-left shadow-sm transition-all ${active ? "border-brand bg-brand text-white shadow-[0_5px_14px_rgba(23,63,115,.22)]" : "border-line bg-white text-ink active:bg-canvas"}`}
                >
                  {active && <span aria-hidden className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-blue-200" />}
                  <span>
                    <span className="block text-[11px] font-bold leading-none">{eventTypeLabels[event.type]}</span>
                    <span className={`mt-1 block text-[9px] leading-none ${active ? "text-white/65" : "text-muted"}`}>{event.date} · {event.time}</span>
                  </span>
                  {event.score !== null && <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${active ? "bg-white/15 text-white" : level.className}`}>{event.score}점</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="hidden xl:block">
        <PageHeader
          title="주행 기록"
          description="운전 중 발이 어떤 순서로 움직였고 페달을 얼마나 세게 밟았는지, 기억하기 쉬운 장면별로 돌아봅니다."
          action={<SampleBadge />}
        />
      </div>
      <div className="hidden flex-nowrap gap-1.5 overflow-x-auto pb-1 xl:flex" role="group" aria-label="주행 장면 유형 필터">
        {filters.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={filter === item.key}
            onClick={() => setFilter(item.key)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap transition-colors ${
              filter === item.key ? "border-brand bg-brand text-white" : "border-line bg-card text-muted hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="grid min-h-0 grid-cols-1 items-start gap-5 overflow-hidden xl:grid-cols-[272px_minmax(0,1fr)] xl:overflow-visible">
        <nav aria-label="주행 장면 목록" className="hidden min-w-0 overflow-hidden rounded-2xl border border-line bg-card shadow-[0_12px_32px_rgba(15,31,54,0.04)] xl:sticky xl:top-6 xl:block">
          <div className="border-b border-line px-4 py-3">
            <p className="text-[11px] font-bold tracking-[0.12em] text-muted uppercase">Detected events</p>
            <p className="mt-0.5 text-sm font-semibold">{visible.length}개의 주행 장면</p>
          </div>
          <ul className="max-h-[calc(100dvh-180px)] divide-y divide-line overflow-y-auto">
            {visible.map((event) => {
              const active = event.id === selected.id;
              const level = eventLevel(event);
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => select(event.id)}
                    className={`block h-full w-full border-y-0 border-r-0 border-l-[3px] px-3.5 py-3 text-left transition-colors ${
                      active ? "border-brand bg-track/70" : "border-line bg-white hover:bg-canvas lg:border-transparent"
                    }`}
                  >
                    <span className="flex gap-2.5">
                      <PedalEventIcon type={event.type} className="h-[44px] w-[67px] shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-semibold">{eventTypeLabels[event.type]}</span>
                          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${level.className}`}>{level.label}{event.score !== null ? ` · ${event.score}점` : ""}</span>
                        </span>
                        <span className="mt-0.5 block text-[11px] font-medium text-brand">{pedalActionLabel(event.type)}</span>
                        <span className="mt-1 block text-xs text-muted">{event.date} · {event.time}</span>
                        <span className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                          <PinIcon className="size-3 shrink-0" />{eventLocation(event)}
                        </span>
                        <span className="mt-1 block text-[11px] font-medium text-ink">{keyFigure(event)}</span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <EventDetail key={selected.id} event={selected} />
      </div>
    </div>
  );
}
