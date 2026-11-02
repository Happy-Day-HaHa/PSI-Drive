import { FootView } from "@/components/FootView";
import { analyzeEvent } from "@/lib/event-analysis";
import type { PedalEvent } from "@/lib/pedal";

export function ForwardSceneView({ event, playheadMs, durationMs, className = "" }: { event: PedalEvent; playheadMs: number; durationMs: number; className?: string }) {
  const progress = Math.min(1, Math.max(0, playheadMs / Math.max(durationMs, 1)));
  const analysis = analyzeEvent(event);
  const pedestrianX = 285 - progress * 92;
  const leadY = 82 + progress * 13;

  return (
    <div className={`relative overflow-hidden rounded-xl bg-[#101c2d] ${className}`}>
      <svg viewBox="0 0 420 236" className="h-full w-full" role="img" aria-label={`${analysis.frontScene} 합성 전방 장면 시각화. 실제 전방 영상은 연결되지 않았습니다.`}>
        <defs>
          <linearGradient id={`sky-${event.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8bb9e7" /><stop offset="1" stopColor="#d8e8f4" /></linearGradient>
          <linearGradient id={`road-${event.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#526173" /><stop offset="1" stopColor="#263445" /></linearGradient>
        </defs>
        <rect width="420" height="104" fill={`url(#sky-${event.id})`} />
        <path d="M0 82 90 62l74 23 76-25 92 23 88-18v39H0Z" fill="#668a77" opacity=".75" />
        <path d="M144 96h132l108 140H36Z" fill={`url(#road-${event.id})`} />
        <path d="M207 100h6l8 38h-22ZM224 151h11l18 85h-31Z" fill="#fff" opacity=".75" />
        <path d="M116 112 49 236M304 112l67 124" stroke="#e5edf5" strokeWidth="3" opacity=".65" />
        {(event.type === "lead_brake" || event.type === "pedestrian") && (
          <g transform={`translate(182 ${leadY})`}>
            <rect width="58" height="34" rx="8" fill="#e7edf3" stroke="#7890a8" />
            <rect x="9" y="5" width="40" height="13" rx="4" fill="#7896b1" /><circle cx="12" cy="33" r="5" fill="#172033" /><circle cx="46" cy="33" r="5" fill="#172033" />
            {event.type === "lead_brake" && <><rect x="5" y="20" width="10" height="5" rx="2" fill="#ef4458" /><rect x="43" y="20" width="10" height="5" rx="2" fill="#ef4458" /></>}
            <rect x="-6" y="-6" width="70" height="46" rx="5" fill="none" stroke="#ffb84d" strokeWidth="2" strokeDasharray="5 3" />
          </g>
        )}
        {event.type === "pedestrian" && (
          <g transform={`translate(${pedestrianX} 107)`}>
            <circle cx="0" cy="0" r="7" fill="#19283c" /><path d="M0 8v26M0 17l-12 13M0 17l12 12M0 34l-10 19M0 34l12 18" stroke="#19283c" strokeWidth="5" strokeLinecap="round" />
            <rect x="-18" y="-12" width="37" height="70" rx="4" fill="none" stroke="#e24054" strokeWidth="2" /><text x="-18" y="-18" fontSize="9" fontWeight="700" fill="#fff">수동 마킹</text>
          </g>
        )}
        {event.type === "overlap" && <g><rect x="98" y="89" width="224" height="52" rx="12" fill="#0b1d35" opacity=".82" /><text x="210" y="111" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">전방 상황 데이터 미수집</text><text x="210" y="129" textAnchor="middle" fontSize="9" fill="#b9c7d8">페달 센서와 풋웰 시각화만 제공됩니다</text></g>}
        <rect x="14" y="14" width="136" height="25" rx="12" fill="#071626" opacity=".76" /><circle cx="29" cy="26.5" r="4" fill="#e24054" /><text x="40" y="30" fontSize="10" fontWeight="700" fill="#fff">합성 전방 장면</text>
        <rect x="14" y="200" width="392" height="22" rx="7" fill="#071626" opacity=".72" /><text x="25" y="214" fontSize="9" fill="#d9e5f1">실제 영상·객체 탐지 미연결 · 상황 이해를 위한 시각화 예시</text>
      </svg>
    </div>
  );
}

export function CameraSyncPanel({ event, playheadMs, durationMs, accel, brake, foot }: { event: PedalEvent; playheadMs: number; durationMs: number; accel: number; brake: number; foot: number }) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><p className="text-[11px] font-bold tracking-[.13em] text-brand uppercase">Synchronized camera view</p><h2 className="mt-1 text-lg font-bold">전방 상황과 발 움직임 동시 보기</h2><p className="mt-1 text-xs text-muted">두 패널은 같은 합성 재생헤드를 사용합니다.</p></div><span className="rounded-full bg-caution-soft px-2.5 py-1 text-[10px] font-bold text-caution">데모 시각화 · 실제 영상 미연결</span></div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
        <div><p className="mb-2 text-xs font-bold">전방 카메라 <span className="ml-1 font-medium text-muted">합성 시나리오</span></p><ForwardSceneView event={event} playheadMs={playheadMs} durationMs={durationMs} className="aspect-video" /></div>
        <div><p className="mb-2 text-xs font-bold">페달 카메라 <span className="ml-1 font-medium text-muted">발 위치 시각화</span></p><div className="rounded-xl bg-canvas p-3"><FootView accel={accel} brake={brake} foot={foot} /></div></div>
      </div>
    </div>
  );
}
