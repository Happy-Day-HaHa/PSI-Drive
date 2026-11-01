// 점수 엔진(Phase 4)과 API가 연결되기 전까지 화면 구성을 보여 주는 샘플 데이터다. 실제 측정값이 아니다.

export type PeriodKey = "7d" | "30d" | "90d";

export type SubScore = {
  key: string;
  label: string;
  description: string;
  score: number;
  // config/scoring_config.v1.yaml의 scoring.weights와 같은 값이다.
  weight: number;
};

export type HabitKey = "transition" | "reaction" | "braking" | "accel" | "overlap";

export type Habit = {
  key: HabitKey;
  label: string;
  score: number;
};

export type Metric = {
  key: "accel" | "brake" | "overlap" | "time" | "distance" | "events";
  label: string;
  value: string;
  unit: string;
  // 음수면 지난 기간보다 줄었다는 뜻이다.
  changePct: number;
  // 줄어드는 쪽이 좋은 지표인지. 주행 시간·거리처럼 좋고 나쁨이 없으면 null이다.
  lowerIsBetter: boolean | null;
};

export type ReactionPhase = {
  key: string;
  label: string;
  span: string;
  ms: number;
  color: string;
  onColor: string;
};

export type PeriodData = {
  label: string;
  compareLabel: string;
  trendTitle: string;
  currentName: string;
  previousName: string;
  trendLabels: string[];
  trendCurrent: number[];
  trendPrevious: number[];
  scoreChange: number;
  subScores: SubScore[];
  habits: Habit[];
  metrics: Metric[];
  reactionMs: [number, number, number, number];
  eventCount: number;
};

export type Alert = {
  title: string;
  when: string;
  body: string;
  severity: "alert" | "caution";
};

export type Trip = {
  date: string;
  time: string;
  minutes: number;
  distanceKm: number;
  score: number;
  events: number;
  sync: "양호" | "주의";
};

export const driver = { id: "DRV-0142", vehicle: "VEH-07" };

const subScoreBase = [
  { key: "responsiveness", label: "반응성", description: "위험 인지부터 브레이크 접촉까지", weight: 35 },
  { key: "braking", label: "제동 품질", description: "제동력 상승과 제동 부드러움", weight: 25 },
  { key: "safety", label: "페달 안전성", description: "페달 중첩과 오조작 의심 패턴", weight: 25 },
  { key: "smoothness", label: "주행 부드러움", description: "급가속과 가속 일관성", weight: 15 },
];

const withSubScores = (scores: number[]): SubScore[] =>
  subScoreBase.map((item, index) => ({ ...item, score: scores[index] }));

const habitBase: { key: HabitKey; label: string }[] = [
  { key: "accel", label: "급가속" },
  { key: "braking", label: "급제동" },
  { key: "overlap", label: "페달 중첩" },
  { key: "transition", label: "페달 전환" },
  { key: "reaction", label: "제동 반응" },
];

const withHabits = (scores: number[]): Habit[] =>
  habitBase.map((item, index) => ({ ...item, score: scores[index] }));

export const periods: Record<PeriodKey, PeriodData> = {
  "7d": {
    label: "최근 7일",
    compareLabel: "지난주",
    trendTitle: "일별 점수 추이",
    currentName: "이번 주",
    previousName: "지난주",
    trendLabels: ["월", "화", "수", "목", "금", "토", "일"],
    trendCurrent: [86, 88, 89, 91, 89, 90, 90],
    trendPrevious: [82, 85, 84, 87, 85, 86, 87],
    scoreChange: 4,
    subScores: withSubScores([88, 87, 94, 84]),
    habits: withHabits([92, 88, 94, 85, 87]),
    metrics: [
      { key: "accel", label: "급가속", value: "1", unit: "회", changePct: -50, lowerIsBetter: true },
      { key: "brake", label: "급제동", value: "1", unit: "회", changePct: 0, lowerIsBetter: true },
      { key: "overlap", label: "페달 중첩", value: "0", unit: "회", changePct: -100, lowerIsBetter: true },
      { key: "time", label: "주행 시간", value: "9.8", unit: "시간", changePct: 5, lowerIsBetter: null },
      { key: "distance", label: "주행 거리", value: "296", unit: "km", changePct: 3, lowerIsBetter: null },
      { key: "events", label: "분석 사건", value: "6", unit: "건", changePct: -14, lowerIsBetter: null },
    ],
    reactionMs: [490, 105, 295, 230],
    eventCount: 6,
  },
  "30d": {
    label: "최근 30일",
    compareLabel: "지난달",
    trendTitle: "주별 점수 추이",
    currentName: "이번 달",
    previousName: "지난달",
    trendLabels: ["1주차", "2주차", "3주차", "4주차"],
    trendCurrent: [81, 85, 89, 92],
    trendPrevious: [77, 80, 82, 85],
    scoreChange: 6,
    subScores: withSubScores([84, 88, 94, 82]),
    habits: withHabits([90, 85, 91, 82, 84]),
    metrics: [
      { key: "accel", label: "급가속", value: "3", unit: "회", changePct: -40, lowerIsBetter: true },
      { key: "brake", label: "급제동", value: "2", unit: "회", changePct: -50, lowerIsBetter: true },
      { key: "overlap", label: "페달 중첩", value: "1", unit: "회", changePct: -50, lowerIsBetter: true },
      { key: "time", label: "주행 시간", value: "42.5", unit: "시간", changePct: 8, lowerIsBetter: null },
      { key: "distance", label: "주행 거리", value: "1,284", unit: "km", changePct: 6, lowerIsBetter: null },
      { key: "events", label: "분석 사건", value: "24", unit: "건", changePct: 9, lowerIsBetter: null },
    ],
    reactionMs: [520, 110, 310, 240],
    eventCount: 24,
  },
  "90d": {
    label: "최근 90일",
    compareLabel: "직전 90일",
    trendTitle: "월별 점수 추이",
    currentName: "최근 90일",
    previousName: "직전 90일",
    trendLabels: ["8월", "9월", "10월"],
    trendCurrent: [80, 84, 87],
    trendPrevious: [76, 78, 79],
    scoreChange: 6,
    subScores: withSubScores([80, 85, 92, 80]),
    habits: withHabits([86, 83, 90, 78, 81]),
    metrics: [
      { key: "accel", label: "급가속", value: "11", unit: "회", changePct: -27, lowerIsBetter: true },
      { key: "brake", label: "급제동", value: "8", unit: "회", changePct: -33, lowerIsBetter: true },
      { key: "overlap", label: "페달 중첩", value: "4", unit: "회", changePct: -20, lowerIsBetter: true },
      { key: "time", label: "주행 시간", value: "121", unit: "시간", changePct: 4, lowerIsBetter: null },
      { key: "distance", label: "주행 거리", value: "3,642", unit: "km", changePct: 2, lowerIsBetter: null },
      { key: "events", label: "분석 사건", value: "71", unit: "건", changePct: 12, lowerIsBetter: null },
    ],
    reactionMs: [560, 120, 345, 265],
    eventCount: 71,
  },
};

export const periodOrder: PeriodKey[] = ["7d", "30d", "90d"];

export function overallScore(subScores: SubScore[]): number {
  return Math.round(subScores.reduce((sum, item) => sum + item.score * item.weight, 0) / 100);
}

export function scoreHeadline(score: number): string {
  if (score >= 80) return "습관이 좋아요!";
  if (score >= 60) return "조금만 더 다듬어요";
  return "함께 점검해 봐요";
}

// 색은 validate_palette.js로 CVD 분리를 확인한 값이다. 칸 안의 글자색은 배경 밝기에 맞췄다.
const reactionBase = [
  { key: "recognize", label: "위험 인지 → 가속 해제 시작", span: "T0–T1", color: "#2563EB", onColor: "#FFFFFF" },
  { key: "release", label: "가속 페달 완전 해제", span: "T1–T2", color: "#14A98A", onColor: "#10223F" },
  { key: "transition", label: "페달 전환", span: "T2–T4", color: "#E8863A", onColor: "#10223F" },
  { key: "rise", label: "제동력 80% 도달", span: "T4–T5", color: "#8B5CF6", onColor: "#FFFFFF" },
];

export function reactionPhases(ms: PeriodData["reactionMs"]): ReactionPhase[] {
  return reactionBase.map((item, index) => ({ ...item, ms: ms[index] }));
}

export const weekly = {
  labels: ["월", "화", "수", "목", "금", "토", "일"],
  current: [86, 88, 89, 91, 89, 90, 90],
  previous: [82, 85, 84, 87, 85, 86, 87],
};

export const mileage = { drivenKm: 1284, goalKm: 2000 };

export const dataQuality = { sync: "양호", missingRatePct: 0.4 };

export const alerts: Alert[] = [
  {
    title: "페달 전환 지연",
    when: "오늘 08:38",
    body: "가속 페달에서 브레이크까지 580ms가 걸렸어요. 최근 30일 평균은 310ms예요.",
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
  { date: "11월 1일 (일)", time: "오전 8:38", minutes: 30, distanceKm: 18.4, score: 84, events: 2, sync: "양호" },
  { date: "10월 31일 (토)", time: "오후 5:52", minutes: 45, distanceKm: 21.7, score: 79, events: 3, sync: "양호" },
  { date: "10월 31일 (토)", time: "오전 8:04", minutes: 32, distanceKm: 18.2, score: 88, events: 1, sync: "주의" },
  { date: "10월 30일 (금)", time: "오후 6:11", minutes: 38, distanceKm: 20.5, score: 86, events: 2, sync: "양호" },
];

export const habitTips: Record<HabitKey, { title: string; body: string }> = {
  accel: { title: "급가속", body: "출발할 때 페달을 2초에 걸쳐 나눠 밟으면 급가속 횟수를 줄이기 쉬워요." },
  braking: { title: "급제동", body: "앞차의 움직임을 일찍 보고 가속 페달을 먼저 떼면 강한 제동이 줄어들어요." },
  overlap: { title: "페달 중첩", body: "두 페달을 함께 밟은 순간은 오조작 신호일 수 있어요. 해당 구간 영상을 확인해 보세요." },
  transition: { title: "페달 전환", body: "뒤꿈치를 축으로 발을 옮기면 가속 페달에서 브레이크로 더 빠르게 넘어갈 수 있어요." },
  reaction: { title: "제동 반응", body: "위험을 본 뒤 브레이크에 닿기까지의 시간이에요. 전방 시야를 넓게 두면 도움이 돼요." },
};
