import type { Metadata } from "next";
import { ScoreGuidePage } from "@/components/ScoreGuidePage";

export const metadata: Metadata = { title: "점수 계산법 | PSI Studio" };

export default function Page() {
  return <ScoreGuidePage />;
}
