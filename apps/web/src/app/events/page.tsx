import type { Metadata } from "next";
import { Suspense } from "react";
import { EventsExplorer } from "@/components/EventsExplorer";

export const metadata: Metadata = { title: "주행 기록 | PSI Studio" };

export default function EventsPage() {
  return (
    <Suspense fallback={<EventsLoading />}>
      <EventsExplorer />
    </Suspense>
  );
}

function EventsLoading() {
  return (
    <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl border border-line bg-white px-6 text-center" role="status" aria-live="polite">
      <div>
        <span className="mx-auto block size-8 animate-pulse rounded-full bg-[#dce9fb] motion-reduce:animate-none" />
        <p className="mt-4 text-sm font-bold">주행 기록을 준비하고 있어요</p>
        <p className="mt-1 text-xs text-muted">발 움직임과 이벤트 시간을 맞추는 중이에요.</p>
      </div>
    </div>
  );
}
