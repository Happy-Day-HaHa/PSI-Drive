// 점수 엔진(Phase 4)과 API가 연결되기 전까지 화면 구성을 보여 주는 샘플 데이터다. 실제 측정값이 아니다.

export type SubScore = {
  key: string;
  label: string;
  description: string;
  score: number;
  // config/scoring_config.v1.yaml의 scoring.weights와 같은 값이다.
  weight: number;
};

export type Alert = {
  title: string;
  when: string;
  body: string;
  severity: "alert" | "caution";
};

export type Trip = {
  date: string;
  departure: string;
  arrival: string;
  minutes: number;
  distanceKm: number;
  score: number;
  events: number;
  sync: "양호" | "주의";
};

export const driver = { id: "DRV-0142", vehicle: "VEH-07" };

export const subScores: SubScore[] = [
  { key: "responsiveness", label: "반응성", description: "위험 인지부터 브레이크 접촉까지", score: 82, weight: 35 },
  { key: "braking", label: "제동 품질", description: "제동력 상승과 제동 부드러움", score: 86, weight: 25 },
  { key: "safety", label: "페달 안전성", description: "페달 중첩과 오조작 의심 패턴", score: 92, weight: 25 },
  { key: "smoothness", label: "주행 부드러움", description: "급가속과 가속 일관성", score: 78, weight: 15 },
];

export const overallScore = Math.round(
  subScores.reduce((sum, item) => sum + item.score * item.weight, 0) / 100,
);

export const scoreChange = 2;

export const mileage = { drivenKm: 1284, goalKm: 2000 };

export const alerts: Alert[] = [
  {
    title: "페달 전환 지연",
    when: "오늘 08:38",
    body: "가속 페달에서 브레이크까지 580ms가 걸렸어요. 최근 평균은 310ms예요.",
    severity: "alert",
  },
  {
    title: "페달 중첩",
    when: "어제 18:12",
    body: "두 페달을 0.6초 동안 함께 밟았어요. 영상에서 발 위치를 확인해 보세요.",
    severity: "alert",
  },
  {
    title: "급제동",
    when: "어제 08:21",
    body: "최대 −0.46g로 감속했어요. 앞차와의 거리를 조금 더 두면 줄일 수 있어요.",
    severity: "caution",
  },
];

export const trips: Trip[] = [
  { date: "오늘", departure: "08:38", arrival: "09:08", minutes: 30, distanceKm: 18.4, score: 84, events: 2, sync: "양호" },
  { date: "어제", departure: "17:52", arrival: "18:37", minutes: 45, distanceKm: 21.7, score: 79, events: 3, sync: "양호" },
  { date: "어제", departure: "08:04", arrival: "08:36", minutes: 32, distanceKm: 18.2, score: 88, events: 1, sync: "주의" },
];

export function scoreBand(score: number): string {
  if (score >= 80) return "양호";
  if (score >= 60) return "보통";
  return "주의";
}
