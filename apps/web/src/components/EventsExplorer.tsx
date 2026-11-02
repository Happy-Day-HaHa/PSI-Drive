"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { EventDetail } from "@/components/EventDetail";
import { PinIcon } from "@/components/Icons";
import { PedalEventIcon } from "@/components/PedalEventIcon";
import { PageHeader, SampleBadge } from "@/components/ui";
import { analyzeEvent } from "@/lib/event-analysis";
import { eventLocation, eventTypeLabels, formatMs, pedalSamples, type EventType, type PedalEvent } from "@/lib/pedal";

const filters: { key: EventType | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "pedestrian", label: eventTypeLabels.pedestrian },
  { key: "lead_brake", label: eventTypeLabels.lead_brake },
  { key: "routine", label: eventTypeLabels.routine },
  { key: "overlap", label: eventTypeLabels.overlap },
];

const sourceFilters = [
  { key: "all", label: "모든 출처" },
  { key: "front", label: "전방 상황 포함" },
  { key: "composite", label: "복합 이벤트" },
  { key: "pedal", label: "페달 중심" },
] as const;

const severityFilters = [
  { key: "all", label: "모든 수준" },
  { key: "attention", label: "살펴보기 이상" },
  { key: "info", label: "정보" },
] as const;

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
  const [sourceFilter, setSourceFilter] = useState<(typeof sourceFilters)[number]["key"]>("all");
  const [severityFilter, setSeverityFilter] = useState<(typeof severityFilters)[number]["key"]>("all");
  const [query, setQuery] = useState("");
  const mobileStrip = useRef<HTMLUListElement>(null);
  const mobileEventButtons = useRef(new Map<string, HTMLButtonElement>());
  const events = pedalSamples.events;
  const visible = useMemo(() => events.filter((event) => {
    const analysis = analyzeEvent(event);
    const typeMatch = filter === "all" || event.type === filter;
    const sourceMatch = sourceFilter === "all"
      || (sourceFilter === "front" && analysis.frontSource !== "미수집")
      || (sourceFilter === "composite" && analysis.category === "복합 이벤트")
      || (sourceFilter === "pedal" && analysis.category === "페달 조작");
    const severityMatch = severityFilter === "all"
      || (severityFilter === "attention" && analysis.severity !== "정보")
      || (severityFilter === "info" && analysis.severity === "정보");
    const normalizedQuery = query.trim().toLowerCase();
    const queryMatch = !normalizedQuery || `${event.id} ${eventTypeLabels[event.type]} ${analysis.subtype} ${eventLocation(event)}`.toLowerCase().includes(normalizedQuery);
    return typeMatch && sourceMatch && severityMatch && queryMatch;
  }), [events, filter, query, severityFilter, sourceFilter]);
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
      <div className="hidden rounded-2xl border border-line/90 bg-white p-4 shadow-[0_8px_22px_rgba(15,31,54,.035)] xl:grid xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center xl:gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="주행 장면 유형 필터">
            {filters.map((item) => (
              <button key={item.key} type="button" aria-pressed={filter === item.key} onClick={() => setFilter(item.key)} className={`inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border px-4 text-center text-[12px] leading-none font-semibold whitespace-nowrap transition-colors ${filter === item.key ? "border-brand bg-brand text-white shadow-sm" : "border-line bg-card text-muted hover:border-[#cbd8e8] hover:text-ink"}`}>{item.label}</button>
            ))}
          </div>
          <span className="mx-1 h-8 w-px bg-line" aria-hidden />
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="데이터 출처 필터">
            {sourceFilters.map((item) => <button key={item.key} type="button" aria-pressed={sourceFilter === item.key} onClick={() => setSourceFilter(item.key)} className={`inline-flex min-h-9 items-center justify-center rounded-full px-3 text-center text-[11px] leading-none font-semibold transition ${sourceFilter === item.key ? "bg-[#eaf2ff] text-brand" : "text-muted hover:bg-canvas"}`}>{item.label}</button>)}
          </div>
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="주의 수준 필터">
            {severityFilters.map((item) => <button key={item.key} type="button" aria-pressed={severityFilter === item.key} onClick={() => setSeverityFilter(item.key)} className={`inline-flex min-h-9 items-center justify-center rounded-full px-3 text-center text-[11px] leading-none font-semibold transition ${severityFilter === item.key ? "bg-caution-soft text-caution" : "text-muted hover:bg-canvas"}`}>{item.label}</button>)}
          </div>
        </div>
        <label className="relative block"><span className="sr-only">이벤트 검색</span><input type="search" value={query} onChange={(input) => setQuery(input.target.value)} placeholder="장면·위치 검색" className="h-10 w-52 rounded-xl border border-line bg-canvas px-3 text-xs outline-none placeholder:text-muted/70 focus:border-brand focus:bg-white" /></label>
      </div>
      <div className="grid min-h-0 grid-cols-1 items-start gap-5 overflow-hidden xl:grid-cols-[380px_minmax(0,1fr)] xl:overflow-visible">
        <nav aria-label="주행 장면 목록" className="hidden min-w-0 overflow-hidden rounded-2xl border border-line bg-card shadow-[0_12px_32px_rgba(15,31,54,0.04)] xl:sticky xl:top-6 xl:block">
          <div className="border-b border-line px-4 py-3">
            <p className="text-[11px] font-bold tracking-[0.12em] text-muted uppercase">Detected events</p>
            <p className="mt-0.5 text-sm font-semibold">{visible.length}개의 주행 장면</p>
          </div>
          <ul className="max-h-[calc(100dvh-180px)] divide-y divide-line overflow-y-auto">
            {visible.length === 0 && (
              <li className="p-5 text-center"><p className="text-sm font-bold">조건에 맞는 장면이 없어요</p><p className="mt-1 text-[11px] leading-relaxed text-muted">다른 유형이나 주의 수준을 선택해 보세요.</p><button type="button" onClick={() => { setFilter("all"); setSourceFilter("all"); setSeverityFilter("all"); setQuery(""); }} className="mt-3 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white">필터 초기화</button></li>
            )}
            {visible.map((event) => {
              const active = event.id === selected.id;
              const level = eventLevel(event);
              const analysis = analyzeEvent(event);
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => select(event.id)}
                    className={`block h-full w-full border-y-0 border-r-0 border-l-[3px] px-4 py-4 text-left transition-colors ${
                      active ? "border-brand bg-track/70" : "border-line bg-white hover:bg-canvas lg:border-transparent"
                    }`}
                  >
                    <span className="flex items-start gap-3">
                      <PedalEventIcon type={event.type} className="h-[52px] w-[80px] shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-3">
                          <span className="pt-0.5 text-base leading-5 font-bold tracking-[-.01em]">{eventTypeLabels[event.type]}</span>
                          <span className={`inline-flex min-h-7 min-w-[72px] shrink-0 items-center justify-center rounded-full px-2 text-center text-[10px] leading-none font-bold ${level.className}`}>{level.label}{event.score !== null ? ` · ${event.score}점` : ""}</span>
                        </span>
                        <span className="mt-1 block text-[12px] leading-relaxed font-semibold text-brand">{analysis.subtype}</span>
                        <span className="mt-2 inline-flex min-h-6 items-center justify-center rounded-md bg-canvas px-2 text-center text-[10px] leading-none font-semibold text-muted">{analysis.frontSource}</span>
                        <span className="mt-2 block text-[13px] leading-none text-muted">{event.date} · {event.time}</span>
                        <span className="mt-2 flex items-center gap-1.5 text-[12px] leading-none text-muted">
                          <PinIcon className="size-3 shrink-0" />{eventLocation(event)}
                        </span>
                        <span className="mt-2 block text-[12px] font-bold text-ink">{keyFigure(event)}</span>
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
