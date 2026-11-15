export type HabitDomain = {
  key: "reaction" | "acceleration" | "braking" | "pedal";
  label: string;
  score: number;
  weight: number;
  color: string;
  soft: string;
  description: string;
};

export const accumulatedHabitSummary = {
  kind: "assumed_accumulated_demo" as const,
  label: "누적 시연 데이터",
  period: "2026.09.07–11.01",
  drives: 24,
  distanceKm: 412,
  drivingHours: 11.8,
  overall: 73,
  domains: [
    { key: "reaction", label: "위험 대응", score: 64, weight: 0.35, color: "#246CE2", soft: "#EEF5FF", description: "위험 확인부터 브레이크 접촉까지" },
    { key: "acceleration", label: "가속 부드러움", score: 78, weight: 0.20, color: "#14A98A", soft: "#EAF8F4", description: "급가속과 페달 압력 변화" },
    { key: "braking", label: "제동 부드러움", score: 74, weight: 0.25, color: "#E24054", soft: "#FFF1F3", description: "급감속과 제동력 상승" },
    { key: "pedal", label: "페달 조작", score: 82, weight: 0.20, color: "#8B5CF6", soft: "#F4F0FF", description: "페달 전환과 동시 입력" },
  ] satisfies HabitDomain[],
  history: [
    { label: "9월 1주", score: 66 },
    { label: "9월 3주", score: 68 },
    { label: "10월 1주", score: 69 },
    { label: "10월 3주", score: 71 },
    { label: "11월 1주", score: 73 },
  ],
};
