import { ACCEL_COLOR, BRAKE_COLOR } from "@/lib/pedal";

type Props = {
  accel: number;
  brake: number;
  foot: number;
};

const BRAKE_X = 58;
const ACCEL_X = 172;
const PEDAL_TOP = 28;
const BRAKE_HEIGHT = 92;
const ACCEL_HEIGHT = 128;

function footStatus(accel: number, brake: number, foot: number) {
  if (accel > 2 && brake > 2) return "두 페달을 함께 밟고 있습니다";
  if (brake > 2) return "브레이크를 밟고 있습니다";
  if (accel > 2) return "가속 페달을 밟고 있습니다";
  if (foot > 0.03 && foot < 0.97) return "발이 페달 사이를 이동하고 있습니다";
  return "페달에서 힘을 뺀 상태입니다";
}

function Pedal({ x, width, height, pressure, color, label }: { x: number; width: number; height: number; pressure: number; color: string; label: string }) {
  const fill = (pressure / 100) * height;
  return (
    <g>
      <rect x={x - width / 2} y={PEDAL_TOP} width={width} height={height} rx="5" fill="var(--color-card)" stroke="#b6c0cf" />
      <rect x={x - width / 2 + 1} y={PEDAL_TOP + height - fill} width={width - 2} height={fill} rx="4" fill={color} fillOpacity="0.85" />
      <text x={x} y={PEDAL_TOP + ACCEL_HEIGHT + 22} textAnchor="middle" className="fill-muted text-[12px]">
        {label}
      </text>
      <text x={x} y={PEDAL_TOP + ACCEL_HEIGHT + 42} textAnchor="middle" className="fill-ink text-[17px] font-bold tabular-nums">
        {Math.round(pressure)}%
      </text>
    </g>
  );
}

export function FootView({ accel, brake, foot }: Props) {
  const footX = ACCEL_X + (BRAKE_X - ACCEL_X) * foot;
  const pressed = Math.max(accel, brake) / 100;
  return (
    <div>
      <svg viewBox="0 0 230 212" className="mx-auto w-full max-w-[250px]" role="img" aria-label={`가속 페달 ${Math.round(accel)}%, 브레이크 ${Math.round(brake)}%. ${footStatus(accel, brake, foot)}`}>
        <Pedal x={BRAKE_X} width={72} height={BRAKE_HEIGHT} pressure={brake} color={BRAKE_COLOR} label="브레이크" />
        <Pedal x={ACCEL_X} width={46} height={ACCEL_HEIGHT} pressure={accel} color={ACCEL_COLOR} label="가속 페달" />
        <g transform={`translate(${footX} ${58 + pressed * 8})`} opacity="0.92">
          <path d="M-20 -18C-20 -40 20 -40 20 -18L24 58C24 78 -24 78 -24 58Z" fill="#1c2b45" fillOpacity="0.22" stroke="#1c2b45" strokeWidth="1.5" />
        </g>
      </svg>
      <p className="mt-1 text-center text-[13px] font-medium">{footStatus(accel, brake, foot)}</p>
    </div>
  );
}
