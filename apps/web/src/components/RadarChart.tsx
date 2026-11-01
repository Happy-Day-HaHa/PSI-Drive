import type { Habit, HabitKey } from "@/lib/sample-data";

type Props = {
  habits: Habit[];
  selected: HabitKey | null;
  onSelect: (key: HabitKey) => void;
};

const CENTER = { x: 170, y: 142 };
const RADIUS = 92;
const RINGS = [25, 50, 75, 100];

function point(index: number, count: number, value: number) {
  const angle = -Math.PI / 2 + (index / count) * 2 * Math.PI;
  const radius = (value / 100) * RADIUS;
  return { x: CENTER.x + Math.cos(angle) * radius, y: CENTER.y + Math.sin(angle) * radius, angle };
}

export function RadarChart({ habits, selected, onSelect }: Props) {
  const count = habits.length;
  const polygon = (values: number[]) =>
    values.map((value, index) => {
      const p = point(index, count, value);
      return `${p.x},${p.y}`;
    }).join(" ");

  return (
    <svg
      viewBox="0 0 340 290"
      className="mx-auto w-full max-w-[360px]"
      role="group"
      aria-label={`운전 습관 항목별 점수: ${habits.map((habit) => `${habit.label} ${habit.score}점`).join(", ")}`}
    >
      {RINGS.map((ring) => (
        <polygon key={ring} points={polygon(habits.map(() => ring))} fill="none" stroke="var(--color-line)" />
      ))}
      {habits.map((habit, index) => {
        const edge = point(index, count, 100);
        return <line key={habit.key} x1={CENTER.x} y1={CENTER.y} x2={edge.x} y2={edge.y} stroke="var(--color-line)" />;
      })}
      <polygon
        points={polygon(habits.map((habit) => habit.score))}
        fill="var(--color-brand)"
        fillOpacity="0.1"
        stroke="var(--color-brand)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {habits.map((habit, index) => {
        const p = point(index, count, habit.score);
        const label = point(index, count, 124);
        const cos = Math.cos(label.angle);
        const anchor = Math.abs(cos) < 0.2 ? "middle" : cos > 0 ? "start" : "end";
        const isSelected = selected === habit.key;
        const labelY = index === 0 ? label.y - 16 : label.y;
        return (
          <g
            key={habit.key}
            role="button"
            tabIndex={0}
            aria-label={`${habit.label} ${habit.score}점 보기`}
            aria-pressed={isSelected}
            className="cursor-pointer outline-none [&:focus-visible_.hit]:stroke-brand"
            onClick={() => onSelect(habit.key)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(habit.key);
              }
            }}
          >
            <circle className="hit" cx={p.x} cy={p.y} r="14" fill="transparent" />
            <circle
              cx={p.x}
              cy={p.y}
              r={isSelected ? 6.5 : 4.5}
              fill="var(--color-brand)"
              stroke="var(--color-card)"
              strokeWidth="2"
            />
            <text x={label.x} y={labelY} textAnchor={anchor} className={`text-[13px] ${isSelected ? "fill-ink font-bold" : "fill-muted"}`}>
              {habit.label}
            </text>
            <text x={label.x} y={labelY + 18} textAnchor={anchor} className="fill-ink text-[14px] font-bold">
              {habit.score}점
            </text>
          </g>
        );
      })}
    </svg>
  );
}
