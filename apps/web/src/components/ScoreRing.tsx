"use client";

import { useEffect, useRef, useState } from "react";

export function ScoreRing({ score, large = false }: { score: number; large?: boolean }) {
  const [displayScore, setDisplayScore] = useState(score);
  const previousScore = useRef(score);
  const radius = 84;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const from = previousScore.current;
    const difference = score - from;
    if (difference === 0) return;
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / 620, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round((from + difference * eased) * 10) / 10);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else previousScore.current = score;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className={`relative shrink-0 ${large ? "size-[230px] sm:size-[260px]" : "size-[168px]"}`}>
      <svg viewBox="0 0 200 200" className="size-full -rotate-90" role="img" aria-label={`종합 점수 100점 만점에 ${score}점`}>
        <circle cx="100" cy="100" r={radius} fill="none" stroke="#e7edf5" strokeWidth={large ? 13 : 11} />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="var(--color-data)"
          strokeWidth={large ? 13 : 11}
          strokeLinecap="round"
          strokeDasharray={`${(displayScore / 100) * circumference} ${circumference}`}
          className="drop-shadow-[0_3px_5px_rgba(38,114,216,.15)]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className={`leading-none font-bold tracking-[-0.05em] tabular-nums ${large ? "text-[66px] sm:text-[76px]" : "text-[52px]"}`}>{Math.round(displayScore)}</p>
        <p className={`text-muted ${large ? "mt-3 text-base" : "mt-1.5 text-[13px]"}`}>100점 만점</p>
      </div>
    </div>
  );
}
