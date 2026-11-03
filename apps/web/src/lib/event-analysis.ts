import { SAMPLE_DT_MS, eventTypeLabels, motionThresholds, type PedalEvent } from "@/lib/pedal";

export type MotionTag = "급가속" | "급감속" | "일반 가감속";

export type EventAnalysis = {
  category: "복합 이벤트" | "차량 움직임" | "페달 조작";
  subtype: string;
  frontScene: string;
  frontSource: "합성 시나리오·수동 마킹" | "미수집";
  severity: "높은 주의" | "살펴보기" | "정보";
  durationMs: number;
  maxJerkGPerS: number;
  maxAccelerationG: number;
  maxDecelerationG: number;
  speedChangeKmh: number;
  maxAccelPedalPct: number;
  maxBrakePedalPct: number;
  motionTags: MotionTag[];
  sources: string[];
  relationship: string;
  confidence: null;
  quality: "분석 가능";
};

const frontSceneByType: Record<PedalEvent["type"], string> = {
  pedestrian: "전방 보행자 출현",
  lead_brake: "선행 차량 감속",
  routine: "일상 감속 구간",
  overlap: "전방 상황 미수집",
  hard_accel: "전방 상황 미수집",
};

export function analyzeEvent(event: PedalEvent): EventAnalysis {
  const orderedMarks = [...event.marks].sort((a, b) => a.ms - b.ms);
  const startMs = orderedMarks[0]?.ms ?? 0;
  const endMs = orderedMarks[orderedMarks.length - 1]?.ms ?? startMs;
  const durationMs = Math.max(0, endMs - startMs);
  const startIndex = Math.max(0, Math.floor(startMs / SAMPLE_DT_MS));
  const endIndex = Math.min(event.series.decelG.length, Math.ceil(endMs / SAMPLE_DT_MS) + 1);
  const eventDecelG = event.series.decelG.slice(startIndex, endIndex);
  const eventAccelPedal = event.series.accel.slice(startIndex, endIndex);
  const eventBrakePedal = event.series.brake.slice(startIndex, endIndex);
  const eventSpeed = event.series.speedKmh.slice(startIndex, endIndex);
  let maxJerkGPerS = 0;
  for (let index = 1; index < eventDecelG.length; index += 1) {
    const jerk = Math.abs(eventDecelG[index] - eventDecelG[index - 1]) / (SAMPLE_DT_MS / 1000);
    maxJerkGPerS = Math.max(maxJerkGPerS, jerk);
  }
  const maxAccelerationG = Math.max(0, ...eventDecelG);
  const minimumAccelerationG = Math.min(0, ...eventDecelG);
  const maxDecelerationG = Math.abs(minimumAccelerationG);
  const motionTags: MotionTag[] = [];
  if (maxAccelerationG >= motionThresholds.hardAccelG) motionTags.push("급가속");
  if (minimumAccelerationG <= motionThresholds.hardBrakeG) motionTags.push("급감속");
  if (motionTags.length === 0) motionTags.push("일반 가감속");
  const speedStartKmh = eventSpeed[0] ?? event.stats.speedStartKmh;
  const speedEndKmh = eventSpeed[eventSpeed.length - 1] ?? event.stats.speedEndKmh;

  const isComposite = event.type === "pedestrian" || event.type === "lead_brake";
  const isOverlap = event.type === "overlap";
  return {
    category: isComposite ? "복합 이벤트" : isOverlap ? "페달 조작" : "차량 움직임",
    subtype: isComposite ? `${frontSceneByType[event.type]} → 운전자 제동 대응` : eventTypeLabels[event.type],
    frontScene: frontSceneByType[event.type],
    frontSource: isComposite || event.type === "routine" ? "합성 시나리오·수동 마킹" : "미수집",
    severity: event.score !== null && event.score < 70 ? "높은 주의" : event.score !== null && event.score < 85 ? "살펴보기" : "정보",
    durationMs,
    maxJerkGPerS,
    maxAccelerationG,
    maxDecelerationG,
    speedChangeKmh: speedEndKmh - speedStartKmh,
    maxAccelPedalPct: Math.min(100, Math.max(0, ...eventAccelPedal)),
    maxBrakePedalPct: Math.min(100, Math.max(0, ...eventBrakePedal)),
    motionTags,
    sources: isComposite ? ["전방 시나리오", "페달 센서", "풋웰 영상", "IMU"] : isOverlap ? ["페달 센서", "풋웰 영상", "IMU"] : ["페달 센서", "IMU"],
    relationship: isComposite ? "전방 상황 확인 → 가속 해제 → 발 이동 → 브레이크 접촉 → 차량 감속" : isOverlap ? "가속 입력 유지 → 브레이크 입력 → 두 페달 중첩 → 입력 해제" : event.type === "hard_accel" ? "가속 입력 증가 → 기준 초과 → 속도 증가 → 기준 아래 복귀" : "가속 해제 → 타력 주행 → 브레이크 접촉 → 차량 감속",
    confidence: null,
    quality: "분석 가능",
  };
}
