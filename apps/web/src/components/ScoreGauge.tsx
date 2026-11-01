import { scoreBand } from "@/lib/sample-data";

type Props = {
  score: number;
  change: number;
};

export function ScoreGauge({ score, change }: Props) {
  const arc = "M 24 116 A 96 96 0 0 1 216 116";
  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <svg viewBox="0 0 240 136" className="w-full" role="img" aria-label={`운전 습관 종합 점수 100점 만점에 ${score}점`}>
        <path d={arc} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="18" strokeLinecap="round" />
        <path
          d={arc}
          fill="none"
          stroke="var(--color-mint)"
          strokeWidth="18"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${score} 100`}
        />
      </svg>
      <div className="absolute inset-x-0 top-[26%] flex flex-col items-center text-white">
        <span className="text-base font-semibold text-white/90">{scoreBand(score)}</span>
        <span className="text-6xl leading-tight font-bold tracking-tight tabular-nums">{score}</span>
        <span className="mt-0.5 text-sm text-white/75">
          지난주보다 <span className="font-semibold text-mint">{change >= 0 ? `+${change}` : `−${Math.abs(change)}`}</span>
        </span>
      </div>
      <div className="-mt-3 flex justify-between px-[6%] text-sm text-white/70 tabular-nums">
        <span>0</span>
        <span>100</span>
      </div>
    </div>
  );
}
