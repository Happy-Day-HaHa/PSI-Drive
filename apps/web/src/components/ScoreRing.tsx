export function ScoreRing({ score }: { score: number }) {
  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative size-[168px] shrink-0">
      <svg viewBox="0 0 200 200" className="size-full -rotate-90" role="img" aria-label={`종합 점수 100점 만점에 ${score}점`}>
        <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--color-track)" strokeWidth="11" />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="var(--color-data)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
          className="transition-[stroke-dasharray] duration-500 ease-out motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[52px] leading-none font-bold tracking-tight">{score}</p>
        <p className="mt-1.5 text-[13px] text-muted">100점 만점</p>
      </div>
    </div>
  );
}
