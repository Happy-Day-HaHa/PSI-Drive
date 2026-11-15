import type { Metadata } from "next";
import { EvidencePage } from "@/components/EvidencePage";

export const metadata: Metadata = { title: "수치 기준·출처 | PSI Studio" };

export default function EvidenceRoute() {
  return <EvidencePage />;
}
