import type { Metadata } from "next";
import { PedalHabits } from "@/components/PedalHabits";

export const metadata: Metadata = { title: "페달 습관 | PSI 스튜디오" };

export default function PedalPage() {
  return <PedalHabits />;
}
