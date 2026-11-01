type Props = {
  score: number;
};

export function ScoreRing({ score }: Props) {
  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative size-[200px] shrink-0">
      <svg viewBox="0 0 200 200" className="size-full -rotate-90" role="img" aria-label={`종합 점수 100점 만점에 ${score}점`}>
        <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--color-brand-track)" strokeWidth="15" />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth="15"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
          className="transition-[stroke-dasharray] duration-500 ease-out motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="leading-none font-extrabold tracking-tight">
          <span className="text-[60px]">{score}</span>
          <span className="ml-0.5 text-2xl">점</span>
        </p>
        <p className="mt-2 text-[15px] text-muted">/ 100점</p>
      </div>
    </div>
  );
}
