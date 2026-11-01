import { ACCEL_COLOR, BRAKE_COLOR } from "@/lib/pedal";

type Props = {
  accel: number;
  brake: number;
  foot: number;
};

const BRAKE_X = 136;
const ACCEL_X = 214;

function state(accel: number, brake: number, foot: number) {
  if (accel > 2 && brake > 2) return { title: "양 페달 입력", detail: "오른발 · 가속 + 브레이크", tone: "text-[#7c3aed]", dot: "bg-[#7c3aed]" };
  if (brake > 2) return { title: "브레이크 제동", detail: "오른발 · 브레이크", tone: "text-alert", dot: "bg-alert" };
  if (accel > 2) return { title: "가속 입력", detail: "오른발 · 가속 페달", tone: "text-data", dot: "bg-data" };
  if (foot > 0.05 && foot < 0.95) return { title: "페달 전환 중", detail: "오른발 · 가속 → 브레이크", tone: "text-caution", dot: "bg-[#e8863a]" };
  return { title: "페달 해제", detail: "오른발 · 입력 없음", tone: "text-muted", dot: "bg-[#94a3b8]" };
}

function Pedal({ x, width, height, pressure, color, label }: { x: number; width: number; height: number; pressure: number; color: string; label: string }) {
  const fillHeight = Math.max(3, (pressure / 100) * height);
  return (
    <g>
      {pressure > 2 && <rect x={x - width / 2 - 7} y={29} width={width + 14} height={height + 14} rx="13" fill={color} opacity="0.1" />}
      <rect x={x - width / 2} y={36} width={width} height={height} rx="7" fill="#f8fafc" stroke="#9aa8ba" strokeWidth="1.2" />
      <path d={`M${x - width / 2 + 7} 47h${width - 14}M${x - width / 2 + 7} 55h${width - 14}M${x - width / 2 + 7} 63h${width - 14}`} stroke="#c8d1dd" strokeWidth="2" strokeLinecap="round" />
      <rect x={x - width / 2 + 2} y={36 + height - fillHeight} width={width - 4} height={fillHeight - 2} rx="5" fill={color} opacity={pressure > 2 ? 0.78 : 0.12} />
      <text x={x} y={36 + height + 17} textAnchor="middle" fontSize="10" fontWeight="650" fill="#566072">{label}</text>
      <text x={x} y={36 + height + 31} textAnchor="middle" fontSize="11" fontWeight="750" fill="#152033">{Math.round(pressure)}%</text>
    </g>
  );
}

function Foot({ x, y, rotate, active, label }: { x: number; y: number; rotate: number; active: boolean; label: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      {active && <ellipse cx="0" cy="2" rx="25" ry="52" fill="#173f73" opacity="0.1" />}
      <path
        d="M-10 44C-19 36-19 18-17 4L-13-30C-11-48-2-58 8-55C19-52 23-41 21-24L17 5C15 22 20 37 9 45C3 50-4 49-10 44Z"
        fill={active ? "#173f73" : "#8090a5"}
        opacity={active ? 0.92 : 0.48}
      />
      <path d="M-10 29C-2 33 7 33 15 28M-13 15C-3 19 8 18 18 12" stroke="white" strokeWidth="1.5" opacity="0.38" />
      <text x="0" y="68" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={active ? "#173f73" : "#64748b"}>{label}</text>
    </g>
  );
}

export function FootView({ accel, brake, foot }: Props) {
  const rightX = ACCEL_X + (BRAKE_X - ACCEL_X) * foot;
  const rotate = 7 - foot * 18;
  const current = state(accel, brake, foot);

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-line/80 bg-[linear-gradient(180deg,#f8fbff_0%,#eef3f8_100%)] p-2">
        <div className="flex items-center justify-between px-1.5 pt-1">
          <span className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase">Footwell camera view</span>
          <span className="rounded-full border border-line bg-white/80 px-2 py-0.5 text-[9px] font-semibold text-muted">동기화 ±5ms</span>
        </div>
        <svg viewBox="0 0 270 226" className="mx-auto mt-1 w-full max-w-[310px]" role="img" aria-label={`${current.detail}. 가속 페달 ${Math.round(accel)}%, 브레이크 ${Math.round(brake)}%`}>
          <defs>
            <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e9eff6" />
              <stop offset="1" stopColor="#dce5ef" />
            </linearGradient>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0 0 10 5 0 10Z" fill="#d97706" />
            </marker>
          </defs>
          <path d="M8 16Q135 -4 262 16V211Q135 229 8 211Z" fill="url(#floor)" stroke="#d5dee9" />
          <path d="M86 24v176" stroke="#cad4e0" strokeDasharray="3 5" />
          <rect x="31" y="49" width="37" height="76" rx="7" fill="#d1dae5" stroke="#aab6c5" />
          <path d="M38 59h23M38 68h23M38 77h23M38 86h23" stroke="#aab6c5" strokeWidth="2" strokeLinecap="round" />
          <text x="49" y="140" textAnchor="middle" fontSize="9" fontWeight="650" fill="#64748b">풋레스트</text>
          <Pedal x={BRAKE_X} width={52} height={70} pressure={brake} color={BRAKE_COLOR} label="브레이크" />
          <Pedal x={ACCEL_X} width={34} height={91} pressure={accel} color={ACCEL_COLOR} label="가속" />
          <path d={`M${ACCEL_X} 167C190 146 164 144 ${BRAKE_X} 159`} fill="none" stroke="#d97706" strokeWidth="2" strokeDasharray="5 5" markerEnd="url(#arrow)" opacity={foot > 0.04 && foot < 0.96 ? 0.9 : 0.3} />
          <Foot x={50} y={174} rotate={-5} active={false} label="왼발 · 고정" />
          <Foot x={rightX} y={171} rotate={rotate} active label="오른발 · 조작" />
          <circle cx={rightX} cy="111" r="4" fill={brake > 2 ? BRAKE_COLOR : accel > 2 ? ACCEL_COLOR : "#d97706"} />
        </svg>
      </div>
      <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-line/80 bg-white px-3 py-2.5">
        <span className={`mt-1 size-2.5 shrink-0 rounded-full ${current.dot}`} />
        <div className="min-w-0">
          <p className={`text-[13px] font-bold ${current.tone}`}>{current.title}</p>
          <p className="mt-0.5 text-xs text-muted">{current.detail} · 왼발은 풋레스트 유지</p>
        </div>
      </div>
    </div>
  );
}
