import type { Metadata } from "next";
import { Suspense } from "react";
import { EventsExplorer } from "@/components/EventsExplorer";

export const metadata: Metadata = { title: "주행 기록 | PSI Studio" };

export default function EventsPage() {
  return (
    <Suspense>
      <EventsExplorer />
    </Suspense>
  );
}
