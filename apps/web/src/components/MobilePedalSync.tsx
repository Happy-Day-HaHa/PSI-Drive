import { ACCEL_COLOR, BRAKE_COLOR } from "@/lib/pedal";

function chartPath(values: number[], x: number, y: number, width: number, height: number) {
  const step = Math.max(1, Math.floor(values.length / 64));
  const points: string[] = [];
  for (let index = 0; index < values.length; index += step) {
    const px = x + (index / Math.max(values.length - 1, 1)) * width;
    const py = y + height - (Math.min(Math.max(values[index], 0), 100) / 100) * height;
    points.push(`${points.length === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  if ((values.length - 1) % step !== 0) {
    const value = values[values.length - 1];
    points.push(`L${x + width} ${y + height - (Math.min(Math.max(value, 0), 100) / 100) * height}`);
  }
  return points.join(" ");
}

export function MobilePedalSync({
  accel,
  brake,
  foot,
  accelSeries,
  brakeSeries,
  playheadMs,
  durationMs,
  stepLabel,
}: {
  accel: number;
  brake: number;
  foot: number;
  accelSeries: number[];
  brakeSeries: number[];
  playheadMs: number;
  durationMs: number;
  stepLabel: string;
}) {
  const footX = 112 - foot * 48;
  const playheadX = 151 + (playheadMs / Math.max(durationMs, 1)) * 190;
  const status = brake > 2 ? "브레이크" : accel > 2 ? "가속 페달" : foot > 0.08 && foot < 0.92 ? "페달 이동" : "페달 해제";
  const statusColor = brake > 2 ? BRAKE_COLOR : accel > 2 ? ACCEL_COLOR : "#d97706";

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-[#f8fafc]">
      <div className="mobile-pedal-frame-header flex items-center justify-between border-b border-line/80 bg-white px-3 py-2">
        <span>
          <span className="block text-[10px] font-bold tracking-[0.12em] text-muted uppercase">동시 보기</span>
          <span className="block text-xs font-bold">{stepLabel}</span>
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 text-[10px] font-semibold">
          <span className="size-2 rounded-full" style={{ background: statusColor }} />{status}
        </span>
      </div>
      <svg viewBox="0 0 360 190" className="mobile-pedal-visual w-full" role="img" aria-label={`현재 ${status}. 시간에 따른 가속 페달과 브레이크 압력 동시 보기`}>
        <rect x="10" y="12" width="124" height="164" rx="12" fill="#edf3f8" />
        <text x="22" y="29" fontSize="9" fontWeight="700" fill="#64748b">발 위치</text>
        <rect x="44" y="42" width="28" height="50" rx="5" fill="#fff" stroke="#aab6c5" />
        <rect x="100" y="42" width="18" height="68" rx="4" fill="#fff" stroke="#8ca1ba" />
        <rect x="46" y={90 - (brake / 100) * 46} width="24" height={Math.max(2, (brake / 100) * 46)} rx="3" fill={BRAKE_COLOR} opacity=".75" />
        <rect x="102" y={108 - (accel / 100) * 64} width="14" height={Math.max(2, (accel / 100) * 64)} rx="3" fill={ACCEL_COLOR} opacity=".75" />
        <text x="58" y="104" textAnchor="middle" fontSize="8" fontWeight="700" fill="#566072">브레이크</text>
        <text x="109" y="121" textAnchor="middle" fontSize="8" fontWeight="700" fill="#566072">가속</text>
        <path d="M110 140C96 128 78 127 59 139" fill="none" stroke="#d97706" strokeDasharray="3 3" />
        <g transform={`translate(${footX} 139) rotate(${8 - foot * 17})`}>
          <path d="M-7 24C-13 17-12 4-11-7L-8-30C-6-43 3-47 11-39C16-34 16-25 14-15L11 7C10 19 6 27-2 28C-4 28-6 26-7 24Z" fill="#173f73" opacity=".9" />
        </g>
        <text x="72" y="168" textAnchor="middle" fontSize="9" fontWeight="700" fill="#173f73">오른발 조작</text>

        <text x="151" y="29" fontSize="9" fontWeight="700" fill="#64748b">시간에 따른 페달 압력</text>
        <rect x="151" y="40" width="190" height="110" rx="8" fill="#fff" stroke="#dfe6ee" />
        <path d="M151 67.5H341M151 95H341M151 122.5H341" stroke="#edf1f5" />
        <path d={chartPath(accelSeries, 151, 40, 190, 110)} fill="none" stroke={ACCEL_COLOR} strokeWidth="2.2" strokeLinejoin="round" />
        <path d={chartPath(brakeSeries, 151, 40, 190, 110)} fill="none" stroke={BRAKE_COLOR} strokeWidth="2.2" strokeLinejoin="round" />
        <path d={`M${playheadX} 40V150`} stroke="#172033" strokeWidth="1.5" />
        <circle cx={playheadX} cy={40 + 110 - (accel / 100) * 110} r="3.5" fill={ACCEL_COLOR} stroke="white" strokeWidth="1.5" />
        <circle cx={playheadX} cy={40 + 110 - (brake / 100) * 110} r="3.5" fill={BRAKE_COLOR} stroke="white" strokeWidth="1.5" />
        <circle cx="158" cy="166" r="3" fill={ACCEL_COLOR} /><text x="165" y="169" fontSize="9" fill="#566072">가속 {Math.round(accel)}%</text>
        <circle cx="239" cy="166" r="3" fill={BRAKE_COLOR} /><text x="246" y="169" fontSize="9" fill="#566072">브레이크 {Math.round(brake)}%</text>
      </svg>
    </div>
  );
}
