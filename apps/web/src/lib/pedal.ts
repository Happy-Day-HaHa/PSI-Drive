// pedal-samples.json은 psi_synth.export_web이 합성 세션의 정답값으로 생성한다. 손으로 고치지 않는다.
import samples from "@/lib/pedal-samples.json";

export type EventType = "pedestrian" | "lead_brake" | "routine" | "overlap";

export type EventMetrics = {
  recognitionMs?: number;
  releaseMs?: number;
  transitionMs?: number;
  totalReactionMs?: number;
  riseMs?: number;
  vehicleDelayMs?: number;
  coastMs?: number;
  overlapMs?: number;
};

export type PedalEvent = {
  id: string;
  type: EventType;
  date: string;
  time: string;
  marks: { key: string; ms: number }[];
  metrics: EventMetrics;
  stats: {
    peakBrakePct: number;
    peakDecelG: number;
    speedStartKmh: number;
    speedEndKmh: number;
    accelBeforePct?: number;
    accelDuringPct?: number;
  };
  score: number | null;
  series: { accel: number[]; brake: number[]; speedKmh: number[]; decelG: number[]; foot: number[] };
};

export type HistogramBin = { label: string; value: number };

type Samples = {
  configVersion: string;
  thresholds: { hardAccelG: number; hardBrakeG: number };
  scope: { sessions: number; distanceKm: number; drivingMinutes: number; hazardEvents: number; hardBrakes: number; hardAccels: number };
  averages: {
    recognitionMs: number;
    releaseMs: number;
    transitionMs: number;
    totalReactionMs: number;
    riseMs: number;
    vehicleDelayMs: number;
    accelPct: number;
    accelCv: number;
    peakBrakePct: number;
  };
  usage: { accel: number; coast: number; brake: number; both: number };
  accelHistogram: HistogramBin[];
  brakePeakHistogram: HistogramBin[];
  transitionHistogram: HistogramBin[];
  transitionFullScoreMs: number;
  transitionZeroScoreMs: number;
  brakeCurve: { stepMs: number; hazard: number[]; routine: number[] };
  events: PedalEvent[];
};

export const pedalSamples = samples as unknown as Samples;
export const motionThresholds = pedalSamples.thresholds;
export const SAMPLE_DT_MS = 20;
export const ACCEL_COLOR = "#246CE2";
export const BRAKE_COLOR = "#E24054";

export const eventTypeLabels: Record<EventType, string> = {
  pedestrian: "보행자 대응",
  lead_brake: "선행차 감속 대응",
  routine: "일상 감속",
  overlap: "페달 중첩",
};

const eventLocations: Record<string, string> = {
  E01: "서울 성동구 · 성수사거리",
  E02: "서울 송파구 · 잠실대교 남단",
  E03: "서울 강남구 · 학동역 교차로",
  E04: "서울 서초구 · 양재시민의숲",
  E05: "서울 광진구 · 어린이대공원 앞",
  E06: "서울 용산구 · 한남오거리",
  E07: "서울 마포구 · 공덕오거리",
  E08: "서울 영등포구 · 여의도공원",
  E09: "서울 종로구 · 광화문광장",
  E10: "서울 중구 · 서울역 서부",
  E11: "서울 성북구 · 길음뉴타운",
  E12: "서울 동작구 · 보라매공원",
};

export function eventLocation(event: Pick<PedalEvent, "id">): string {
  return eventLocations[event.id] ?? "위치 정보 확인 중";
}

export const stepInfo: Record<string, { title: string; body: string; source: string }> = {
  T0: { title: "주의 상황 확인", body: "전방 영상에서 대응이 필요한 상황이 나타난 시점입니다.", source: "전방 영상" },
  T1: { title: "가속 페달 해제 시작", body: "가속 페달에서 힘을 빼기 시작했습니다.", source: "압력 센서" },
  T2: { title: "가속 페달 완전 해제", body: "가속 페달 압력이 2% 이하로 떨어졌습니다.", source: "압력 센서" },
  T3: { title: "발 이동 시작", body: "발이 브레이크 쪽으로 움직이기 시작했습니다.", source: "풋웰 영상" },
  T4: { title: "브레이크 접촉", body: "브레이크 압력이 오르기 시작했습니다.", source: "압력 센서" },
  T5: { title: "제동력 80% 도달", body: "이번 장면 최대 압력의 80%에 도달했습니다.", source: "압력 센서" },
  T6: { title: "차량 감속 시작", body: "차량 감속도가 0.1g를 넘었습니다.", source: "IMU" },
  T7: { title: "장면 종료", body: "차량이 정지했거나 브레이크를 놓았습니다.", source: "IMU·압력 센서" },
  O0: { title: "페달 중첩 시작", body: "가속 페달을 밟은 채 브레이크 압력이 올랐습니다.", source: "압력 센서" },
  O1: { title: "페달 중첩 종료", body: "두 페달 중 하나의 압력이 해제되었습니다.", source: "압력 센서" },
};

export function formatMs(ms: number): string {
  return `${ms.toLocaleString("ko-KR")}ms`;
}

export function compareToAverage(value: number, average: number): { text: string; better: boolean | null } {
  const diff = value - average;
  if (Math.abs(diff) < 10) return { text: "평균과 비슷", better: null };
  return { text: `평균보다 ${Math.abs(diff)}ms ${diff < 0 ? "빠름" : "느림"}`, better: diff < 0 };
}

export function eventHeadline(event: PedalEvent): string {
  const { metrics, stats } = event;
  if (event.type === "overlap") {
    return `가속 페달을 약 ${Math.round(stats.accelDuringPct ?? 0)}% 밟은 상태에서 브레이크를 최대 ${Math.round(stats.peakBrakePct)}%까지 함께 밟았습니다. 중첩은 ${formatMs(metrics.overlapMs ?? 0)} 동안 이어졌습니다.`;
  }
  if (event.type === "routine") {
    return `가속 페달을 뗀 뒤 ${((metrics.coastMs ?? 0) / 1000).toFixed(1)}초 동안 타력으로 주행하고, 브레이크를 최대 ${Math.round(stats.peakBrakePct)}%까지 천천히 밟았습니다.`;
  }
  return `상황 확인 후 ${formatMs(metrics.recognitionMs ?? 0)}에 가속 페달에서 힘을 빼기 시작했고, ${formatMs(metrics.totalReactionMs ?? 0)}에 브레이크에 닿았습니다. 브레이크를 최대 ${Math.round(stats.peakBrakePct)}%까지 밟아 ${stats.peakDecelG.toFixed(2)}g로 감속했습니다.`;
}

export type Finding = { kind: "good" | "watch" | "info"; text: string };

export function eventFindings(event: PedalEvent): Finding[] {
  const { metrics, stats } = event;
  const average = pedalSamples.averages;
  const findings: Finding[] = [];
  if (event.type === "overlap") {
    findings.push({ kind: "watch", text: "두 페달을 함께 밟으면 제동 거리가 길어질 수 있습니다. 왼발 사용이나 발 위치를 영상으로 확인하시기 바랍니다." });
    findings.push({ kind: "info", text: `이 구간의 감속은 최대 ${stats.peakDecelG.toFixed(2)}g로 크지 않았습니다.` });
    return findings;
  }
  if (event.type === "routine") {
    findings.push({ kind: "good", text: "브레이크 전에 가속 페달을 미리 떼어 여유 있게 감속했습니다." });
    findings.push({ kind: "good", text: `제동력이 ${formatMs(metrics.riseMs ?? 0)}에 걸쳐 완만하게 올라 승차감에 유리한 조작입니다.` });
    return findings;
  }
  const transition = metrics.transitionMs ?? 0;
  const rise = metrics.riseMs ?? 0;
  const recognition = metrics.recognitionMs ?? 0;
  if (transition <= average.transitionMs - 10) {
    findings.push({ kind: "good", text: `페달 전환이 평균보다 ${average.transitionMs - transition}ms 빨랐습니다.` });
  } else if (transition >= average.transitionMs + 10) {
    findings.push({ kind: "watch", text: `페달 전환이 평균보다 ${transition - average.transitionMs}ms 느렸습니다. 뒤꿈치를 축으로 발을 옮기면 시간을 줄일 수 있습니다.` });
  }
  if (recognition >= average.recognitionMs + 50) {
    findings.push({ kind: "watch", text: `가속 페달 해제가 평균보다 ${recognition - average.recognitionMs}ms 늦게 시작되었습니다. 전방 영상에서 당시 상황을 확인하시기 바랍니다.` });
  } else if (recognition <= average.recognitionMs - 50) {
    findings.push({ kind: "good", text: `상황을 확인하고 가속 페달을 떼기 시작한 시점이 평균보다 ${average.recognitionMs - recognition}ms 빨랐습니다.` });
  }
  if (rise <= 200 && stats.peakBrakePct >= 70) {
    findings.push({ kind: "good", text: `${formatMs(rise)} 만에 제동력을 올려 단호하게 제동했습니다.` });
  } else if (rise >= 350) {
    findings.push({ kind: "watch", text: `제동력이 오르는 데 ${formatMs(rise)}가 걸렸습니다. 빠른 대응이 필요할 때는 초기에 조금 더 힘을 주면 좋습니다.` });
  }
  if (findings.length === 0) findings.push({ kind: "info", text: "이번 장면의 조작은 전반적으로 평소 수준입니다." });
  return findings;
}

function byMax(events: PedalEvent[], read: (event: PedalEvent) => number): PedalEvent {
  return events.reduce((best, event) => (read(event) > read(best) ? event : best));
}

export type EventAlert = { event: PedalEvent; title: string; body: string; severity: "alert" | "caution" };

export function eventAlerts(): EventAlert[] {
  const { events, averages } = pedalSamples;
  const hazards = events.filter((event) => event.type === "pedestrian" || event.type === "lead_brake");
  const slowest = byMax(hazards, (event) => event.metrics.transitionMs ?? 0);
  const overlap = byMax(events.filter((event) => event.type === "overlap"), (event) => event.metrics.overlapMs ?? 0);
  const hardest = byMax(hazards.filter((event) => event !== slowest), (event) => event.stats.peakDecelG);
  return [
    {
      event: slowest,
      title: "페달 전환 지연",
      body: `가속 페달에서 브레이크까지 ${formatMs(slowest.metrics.transitionMs ?? 0)}가 걸렸습니다. 평균은 ${formatMs(averages.transitionMs)}입니다.`,
      severity: "alert",
    },
    {
      event: overlap,
      title: "페달 중첩",
      body: `두 페달을 ${formatMs(overlap.metrics.overlapMs ?? 0)} 동안 함께 밟았습니다. 발 위치 확인이 필요합니다.`,
      severity: "alert",
    },
    {
      event: hardest,
      title: "강한 제동",
      body: `브레이크를 ${Math.round(hardest.stats.peakBrakePct)}%까지 밟아 최대 ${hardest.stats.peakDecelG.toFixed(2)}g로 감속했습니다.`,
      severity: "caution",
    },
  ];
}
