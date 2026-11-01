import type { Metadata } from "next";
import { Suspense } from "react";
import { EventsExplorer } from "@/components/EventsExplorer";

export const metadata: Metadata = { title: "사건 분석 | PSI 스튜디오" };

export default function EventsPage() {
  return (
    <Suspense>
      <EventsExplorer />
    </Suspense>
  );
}
