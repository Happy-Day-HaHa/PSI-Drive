import type { EventType } from "@/lib/pedal";

const labels: Record<EventType, string> = {
  pedestrian: "오른발이 가속 페달에서 브레이크로 이동",
  lead_brake: "오른발이 가속 페달에서 브레이크로 이동",
  routine: "오른발로 브레이크 제동",
  overlap: "양 페달 동시 입력 감지",
  hard_accel: "오른발로 가속 페달을 빠르게 입력",
};

export function pedalActionLabel(type: EventType) {
  return labels[type];
}

export function PedalEventIcon({ type, className = "" }: { type: EventType; className?: string }) {
  const overlap = type === "overlap";
  const hazard = type === "pedestrian" || type === "lead_brake";
  const hardAccel = type === "hard_accel";
  const footX = overlap ? 47 : hardAccel ? 63 : 40;
  return (
    <svg
      viewBox="0 0 88 58"
      className={className}
      role="img"
      aria-label={labels[type]}
    >
      <rect x="0.5" y="0.5" width="87" height="57" rx="10" fill="#f2f6fa" stroke="#dfe6ee" />
      <rect x="24" y="8" width="19" height="27" rx="4" fill={overlap || (!hazard && !hardAccel) ? "#feecef" : "#f8fafc"} stroke="#c45a66" />
      <rect x="57" y="8" width="12" height="34" rx="3.5" fill={overlap || hardAccel ? "#eaf2fd" : "#f8fafc"} stroke="#4c7fc5" />
      {hazard && <path d="M63 45C58 50 50 50 43 44" fill="none" stroke="#d97706" strokeWidth="1.5" strokeDasharray="3 2" />}
      <g transform={`translate(${footX} 35) rotate(${overlap ? 18 : -9})`}>
        <path d="M-6 17C-11 12-10 3-9-4L-7-18C-6-27 0-30 6-26C11-22 11-16 10-9L8 4C7 12 5 18-1 19C-3 19-5 18-6 17Z" fill={overlap ? "#7c3aed" : hardAccel ? "#246ce2" : "#173f73"} opacity=".9" />
      </g>
      <circle cx={overlap ? 55 : hardAccel ? 63 : 38} cy="15" r="3" fill={overlap ? "#7c3aed" : hardAccel ? "#246ce2" : "#c23343"} />
    </svg>
  );
}
