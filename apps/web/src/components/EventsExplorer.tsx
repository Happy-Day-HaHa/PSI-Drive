"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { EventDetail } from "@/components/EventDetail";
import { PedalEventIcon, pedalActionLabel } from "@/components/PedalEventIcon";
import { PageHeader, SampleBadge } from "@/components/ui";
import { eventTypeLabels, formatMs, pedalSamples, type EventType, type PedalEvent } from "@/lib/pedal";

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

export function EventsExplorer() {
  const router = useRouter();
  const params = useSearchParams();
  const [filter, setFilter] = useState<EventType | "all">("all");
  const events = pedalSamples.events;
  const visible = useMemo(() => (filter === "all" ? events : events.filter((event) => event.type === filter)), [events, filter]);
  const selected = events.find((event) => event.id === params.get("id")) ?? events.find((event) => event.type === "pedestrian") ?? events[0];

  const select = (id: string) => router.replace(`/events?id=${id}`, { scroll: false });

  return (
    <>
      <PageHeader
        title="사건 분석"
        description="위험 상황과 일상 감속에서 발이 어떤 순서로 움직였고, 페달을 얼마나 세게 밟았는지 사건별로 확인합니다."
        action={<SampleBadge />}
      />
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="사건 유형 필터">
        {filters.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={filter === item.key}
            onClick={() => setFilter(item.key)}
            className={`rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors ${
              filter === item.key ? "border-brand bg-brand text-white" : "border-line bg-card text-muted hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[272px_minmax(0,1fr)]">
        <nav aria-label="사건 목록" className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_12px_32px_rgba(15,31,54,0.04)] lg:sticky lg:top-6">
          <div className="border-b border-line px-4 py-3">
            <p className="text-[11px] font-bold tracking-[0.12em] text-muted uppercase">Detected events</p>
            <p className="mt-0.5 text-sm font-semibold">{visible.length}건의 페달 사건</p>
          </div>
          <ul className="flex max-h-[420px] flex-col divide-y divide-line overflow-y-auto lg:max-h-[calc(100dvh-180px)]">
            {visible.map((event) => {
              const active = event.id === selected.id;
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => select(event.id)}
                    className={`block w-full border-l-[3px] px-3.5 py-3 text-left transition-colors ${
                      active ? "border-brand bg-track/70" : "border-transparent hover:bg-canvas"
                    }`}
                  >
                    <span className="flex gap-2.5">
                      <PedalEventIcon type={event.type} className="h-[44px] w-[67px] shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-semibold">{eventTypeLabels[event.type]}</span>
                          {event.score !== null && <span className="text-[13px] font-bold">{event.score}점</span>}
                        </span>
                        <span className="mt-0.5 block text-[11px] font-medium text-brand">{pedalActionLabel(event.type)}</span>
                        <span className="mt-0.5 block text-xs text-muted">{event.date} · {keyFigure(event)}</span>
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
    </>
  );
}
