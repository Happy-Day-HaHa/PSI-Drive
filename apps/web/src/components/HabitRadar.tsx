import type { HabitDomain } from "@/lib/habit-summary";

const CENTER = 110;
const RADIUS = 72;

function point(index: number, value: number) {
  const angle = -Math.PI / 2 + index * (Math.PI / 2);
  return [CENTER + Math.cos(angle) * RADIUS * value, CENTER + Math.sin(angle) * RADIUS * value] as const;
}

function polygon(value: number) {
  return [0, 1, 2, 3].map((index) => point(index, value).join(",")).join(" ");
}

export function HabitRadar({ domains }: { domains: HabitDomain[] }) {
  const scorePoints = domains.map((domain, index) => point(index, domain.score / 100).join(",")).join(" ");
  return (
    <svg viewBox="0 0 220 220" className="mx-auto w-full max-w-[310px]" role="img" aria-label={domains.map((domain) => `${domain.label} ${domain.score}점`).join(", ")}>
      {[0.25, 0.5, 0.75, 1].map((value) => <polygon key={value} points={polygon(value)} fill="none" stroke="#dbe4ef" strokeWidth="1" />)}
      {[0, 1, 2, 3].map((index) => {
        const [x, y] = point(index, 1);
        return <line key={index} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="#dbe4ef" />;
      })}
      <polygon points={scorePoints} fill="rgba(36,108,226,.18)" stroke="#246CE2" strokeWidth="3" strokeLinejoin="round" />
      {domains.map((domain, index) => {
        const [x, y] = point(index, domain.score / 100);
        return <circle key={domain.key} cx={x} cy={y} r="4" fill={domain.color} stroke="white" strokeWidth="2" />;
      })}
      <text x="110" y="20" textAnchor="middle" className="fill-ink text-[10px] font-bold">위험 대응 {domains[0].score}</text>
      <text x="215" y="108" textAnchor="end" className="fill-ink text-[10px] font-bold">가속 {domains[1].score}</text>
      <text x="110" y="213" textAnchor="middle" className="fill-ink text-[10px] font-bold">제동 {domains[2].score}</text>
      <text x="5" y="108" className="fill-ink text-[10px] font-bold">페달 {domains[3].score}</text>
    </svg>
  );
}
