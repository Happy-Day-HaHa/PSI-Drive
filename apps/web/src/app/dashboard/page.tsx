import type { Metadata } from "next";
import { Dashboard } from "@/components/Dashboard";

export const metadata: Metadata = { title: "대시보드 | PSI Studio" };

export default function DashboardPage() {
  return <Dashboard />;
}
