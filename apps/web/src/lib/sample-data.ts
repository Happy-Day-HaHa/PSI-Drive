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
};

export type Trip = {
  eventId: string;
  date: string;
  time: string;
  location: string;
  minutes: number;
  distanceKm: number;
  score: number;
  events: number;
  sync: "양호" | "주의";
};

export const driver = {
  id: "DRV-0142",
  vehicle: "VEH-07",
  vehicleModel: "현대 아이오닉 5",
  trim: "롱레인지 2WD · 2025",
  plate: "12가 ••42",
};

export const inspection = {
  period: "2026.10.20 – 2026.11.20",
  nextDate: "11월 20일",
  daysLeft: 19,
  lastChecked: "2026년 10월 20일",
};

export const devices = [
  { id: "CAM-F01", label: "전방 블랙박스", battery: 82, storage: 68, status: "연결 양호", detail: "1080p · 30fps", lastSync: "11월 1일 19:42" },
  { id: "CAM-P01", label: "페달 블랙박스", battery: 76, storage: 54, status: "연결 양호", detail: "720p · 60fps", lastSync: "11월 1일 19:42" },
  { id: "PED-S01", label: "페달 센서", battery: 91, storage: 32, status: "수집 중", detail: "500Hz · 2채널", lastSync: "11월 1일 19:43" },
];

export const dataHealth = {
  lastSync: "2026년 11월 1일 오후 7:43",
  analysisRange: "2026년 10월 3일 – 11월 1일",
  sensorCoveragePct: 99.6,
  videoCoveragePct: 96.8,
  missingSegments: 1,
  storageUsedGb: 18.6,
  storageTotalGb: 30,
};

const subScoreBase = [
  { key: "responsiveness", label: "반응성", description: "상황 확인부터 브레이크 접촉까지", weight: 35 },
  { key: "braking", label: "제동 품질", description: "제동력 상승과 제동 부드러움", weight: 25 },
  { key: "safety", label: "페달 안전성", description: "페달 중첩과 오조작 의심 패턴", weight: 25 },
  { key: "smoothness", label: "주행 부드러움", description: "급가속과 가속 일관성", weight: 15 },
];

const withSubScores = (scores: number[]): SubScore[] =>
  subScoreBase.map((item, index) => ({ ...item, score: scores[index] }));

const habitBase: { key: HabitKey; label: string }[] = [
  { key: "accel", label: "급가속" },
  { key: "braking", label: "급감속" },
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
      { key: "brake", label: "급감속", value: "1", unit: "회", changePct: 0, lowerIsBetter: true },
      { key: "overlap", label: "페달 중첩", value: "0", unit: "회", changePct: -100, lowerIsBetter: true },
      { key: "time", label: "주행 시간", value: "9.8", unit: "시간", changePct: 5, lowerIsBetter: null },
      { key: "distance", label: "주행 거리", value: "296", unit: "km", changePct: 3, lowerIsBetter: null },
      { key: "events", label: "주행 장면", value: "6", unit: "개", changePct: -14, lowerIsBetter: null },
    ],
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
      { key: "brake", label: "급감속", value: "2", unit: "회", changePct: -50, lowerIsBetter: true },
      { key: "overlap", label: "페달 중첩", value: "1", unit: "회", changePct: -50, lowerIsBetter: true },
      { key: "time", label: "주행 시간", value: "42.5", unit: "시간", changePct: 8, lowerIsBetter: null },
      { key: "distance", label: "주행 거리", value: "1,284", unit: "km", changePct: 6, lowerIsBetter: null },
      { key: "events", label: "주행 장면", value: "24", unit: "개", changePct: 9, lowerIsBetter: null },
    ],
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
      { key: "brake", label: "급감속", value: "8", unit: "회", changePct: -33, lowerIsBetter: true },
      { key: "overlap", label: "페달 중첩", value: "4", unit: "회", changePct: -20, lowerIsBetter: true },
      { key: "time", label: "주행 시간", value: "121", unit: "시간", changePct: 4, lowerIsBetter: null },
      { key: "distance", label: "주행 거리", value: "3,642", unit: "km", changePct: 2, lowerIsBetter: null },
      { key: "events", label: "주행 장면", value: "71", unit: "개", changePct: 12, lowerIsBetter: null },
    ],
  },
};

export const periodOrder: PeriodKey[] = ["7d", "30d", "90d"];

export function overallScore(subScores: SubScore[]): number {
  return Math.round(subScores.reduce((sum, item) => sum + item.score * item.weight, 0) / 100);
}

export function scoreBand(score: number): string {
  if (score >= 80) return "양호";
  if (score >= 60) return "보통";
  return "주의";
}

export const weekly = {
  labels: ["월", "화", "수", "목", "금", "토", "일"],
  current: [86, 88, 89, 91, 89, 90, 90],
  previous: [82, 85, 84, 87, 85, 86, 87],
};

export const mileage = { drivenKm: 1284, goalKm: 2000 };

export const dataQuality = { sync: "양호", missingRatePct: 0.4 };

export const trips: Trip[] = [
  { eventId: "E01", date: "11월 1일 (일)", time: "오전 8:38", location: "성수사거리 → 천호대교", minutes: 30, distanceKm: 18.4, score: 84, events: 2, sync: "양호" },
  { eventId: "E04", date: "10월 31일 (토)", time: "오후 5:47", location: "양재시민의숲 → 한남오거리", minutes: 45, distanceKm: 21.7, score: 79, events: 3, sync: "양호" },
  { eventId: "E03", date: "10월 31일 (토)", time: "오전 8:21", location: "학동역 교차로 → 광화문", minutes: 32, distanceKm: 18.2, score: 88, events: 1, sync: "주의" },
  { eventId: "E06", date: "10월 30일 (금)", time: "오후 7:03", location: "한남오거리 → 서울역", minutes: 38, distanceKm: 20.5, score: 86, events: 2, sync: "양호" },
];

export const habitTips: Record<HabitKey, string> = {
  accel: "출발할 때 페달을 2초에 걸쳐 나누어 밟으면 급가속 횟수를 줄일 수 있습니다.",
  braking: "앞차의 움직임을 일찍 확인하고 가속 페달을 먼저 떼면 강한 제동이 줄어듭니다.",
  overlap: "두 페달을 함께 밟은 순간입니다. 해당 구간은 주행 돌아보기에서 편하게 확인할 수 있습니다.",
  transition: "뒤꿈치를 축으로 발을 옮기면 가속 페달에서 브레이크로 더 빠르게 넘어갈 수 있습니다.",
  reaction: "상황을 확인한 뒤 브레이크에 닿기까지의 시간입니다. 전방 시야를 넓게 유지하면 도움이 됩니다.",
};
