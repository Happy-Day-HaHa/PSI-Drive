import type { Metadata } from "next";
import { PedalHabits } from "@/components/PedalHabits";

export const metadata: Metadata = { title: "운전 습관 | PSI Studio" };

export default function PedalPage() {
  return <PedalHabits />;
}
