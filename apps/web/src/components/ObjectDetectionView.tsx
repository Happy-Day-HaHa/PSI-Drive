import { analyzeEvent } from "@/lib/event-analysis";
import type { PedalEvent } from "@/lib/pedal";

type Detection = {
  id: string;
  label: string;
  confidence: number;
  tone: "danger" | "watch" | "safe";
  box: { left: number; top: number; width: number; height: number };
};

const toneStyle = {
  danger: { border: "#ff4058", label: "bg-[#ff4058] text-white", name: "위험 대상" },
  watch: { border: "#ffb020", label: "bg-[#ffb020] text-[#281600]", name: "주의 대상" },
  safe: { border: "#32d6a0", label: "bg-[#32d6a0] text-[#03251b]", name: "추적 중" },
};

function detectionsFor(event: PedalEvent, progress: number): Detection[] {
  const approach = Math.max(0, Math.min(1, progress));
  if (event.type === "pedestrian") return [
    { id: "P-01", label: "보행자", confidence: 94, tone: "danger", box: { left: 55 - approach * 4, top: 34 + approach * 4, width: 11 + approach * 4, height: 34 + approach * 8 } },
    { id: "V-12", label: "선행 차량", confidence: 98, tone: "watch", box: { left: 37, top: 43, width: 20, height: 24 } },
    { id: "S-02", label: "교통 신호", confidence: 91, tone: "safe", box: { left: 77, top: 12, width: 7, height: 20 } },
  ];
  if (event.type === "lead_brake") return [
    { id: "V-07", label: "감속 차량", confidence: 97, tone: "danger", box: { left: 39 - approach * 2, top: 37 + approach * 3, width: 24 + approach * 5, height: 30 + approach * 5 } },
    { id: "V-11", label: "옆 차로 차량", confidence: 93, tone: "safe", box: { left: 69, top: 45, width: 15, height: 21 } },
    { id: "S-04", label: "교통 신호", confidence: 89, tone: "watch", box: { left: 19, top: 13, width: 7, height: 19 } },
  ];
  if (event.type === "routine") return [
    { id: "V-03", label: "선행 차량", confidence: 96, tone: "safe", box: { left: 41, top: 41, width: 21, height: 27 } },
    { id: "V-08", label: "옆 차로 차량", confidence: 92, tone: "safe", box: { left: 70, top: 47, width: 14, height: 20 } },
  ];
  return [];
}

export function ObjectDetectionView({ event, playheadMs, durationMs, accel, brake, compact = false }: { event: PedalEvent; playheadMs: number; durationMs: number; accel: number; brake: number; compact?: boolean }) {
  const analysis = analyzeEvent(event);
  const progress = playheadMs / Math.max(durationMs, 1);
  const detections = detectionsFor(event, progress);
  const primary = detections.find((item) => item.tone === "danger") ?? detections[0];

  return (
    <div className="overflow-hidden rounded-xl border border-[#243c5d] bg-[#07182c] text-white shadow-[0_12px_30px_rgba(5,20,39,.18)]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2"><span className="size-2 animate-pulse rounded-full bg-[#ff4058] motion-reduce:animate-none" /><span className="text-[10px] font-bold tracking-[.1em] text-white/75 uppercase">Front camera · Object tracking</span></div>
        <span className="rounded bg-white/10 px-2 py-1 text-[9px] font-bold text-white/65">시연 분석</span>
      </div>

      <div className="relative aspect-video overflow-hidden bg-[#132a44]" role="img" aria-label={`${analysis.frontScene}. ${detections.map((item) => `${item.label} ${item.confidence}%`).join(", ") || "전방 영상 미수집"}`}>
        <svg viewBox="0 0 640 360" className="absolute inset-0 size-full" aria-hidden>
          <defs><linearGradient id={`sky-${event.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#54728d" /><stop offset="1" stopColor="#b7c7d3" /></linearGradient><linearGradient id={`road-${event.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#46515e" /><stop offset="1" stopColor="#17202b" /></linearGradient></defs>
          <rect width="640" height="190" fill={`url(#sky-${event.id})`} />
          <path d="M0 110h92v80H0zM102 82h80v108h-80zM468 95h72v95h-72zM550 68h90v122h-90z" fill="#526373" opacity=".8" />
          <path d="M0 360V175L245 150h150l245 25v185Z" fill={`url(#road-${event.id})`} />
          <path d="M320 164 275 360M348 164 420 360M205 178 78 360M443 178 598 360" stroke="#f6f7f8" strokeWidth="5" strokeDasharray="30 24" opacity=".78" />
          <path d="M286 252h91l18 47H264Z" fill="#273849" stroke="#95a6b8" strokeWidth="3" /><rect x="281" y="263" width="95" height="35" rx="8" fill="#53697c" /><circle cx="282" cy="303" r="9" fill="#0c1219" /><circle cx="376" cy="303" r="9" fill="#0c1219" />
          <path d="M515 271h61l13 33h-84Z" fill="#384c60" /><circle cx="515" cy="307" r="7" fill="#0c1219" /><circle cx="577" cy="307" r="7" fill="#0c1219" />
          {event.type === "pedestrian" && <g transform={`translate(${390 - progress * 24} ${220 + progress * 16})`}><circle cx="0" cy="-28" r="9" fill="#1f2937" /><path d="M0-18v34m0-20-18 17m18-17 16 14m-16 6-14 30m14-30 17 29" stroke="#1f2937" strokeWidth="8" strokeLinecap="round" /></g>}
        </svg>

        {detections.length === 0 && <div className="absolute inset-0 grid place-items-center bg-[#07182c]/80 text-center"><div><p className="text-sm font-extrabold">전방 영상 미수집</p><p className="mt-1 text-[10px] text-white/55">이 장면은 페달 블랙박스 중심으로 분석합니다</p></div></div>}
        {detections.map((item) => {
          const tone = toneStyle[item.tone];
          return <div key={item.id} className="absolute border-2 transition-all duration-150" style={{ left: `${item.box.left}%`, top: `${item.box.top}%`, width: `${item.box.width}%`, height: `${item.box.height}%`, borderColor: tone.border, boxShadow: `0 0 0 1px ${tone.border}33` }}>
            <span className={`absolute -top-[22px] left-[-2px] whitespace-nowrap px-1.5 py-1 text-[8px] font-black ${tone.label}`}>{item.id} · {item.label} {item.confidence}%</span>
            <span className="absolute right-[-2px] bottom-[-18px] bg-black/65 px-1.5 py-0.5 text-[7px] font-bold text-white">{tone.name}</span>
          </div>;
        })}
        <div className="absolute right-2 bottom-2 rounded bg-black/55 px-2 py-1 text-[8px] font-bold tabular-nums">{Math.round(playheadMs)}ms · {detections.length} objects</div>
      </div>

      {!compact && <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-white/10 px-3 py-2.5">
        <div className="min-w-0"><p className="truncate text-[11px] font-bold">{primary ? `${primary.label} ${primary.confidence}% 추적` : "페달 영상만 분석 중"}</p><p className="mt-0.5 truncate text-[9px] text-white/50">전방 객체와 운전자 페달 반응을 같은 시점으로 연결</p></div>
        <div className="flex gap-1.5 text-[9px] font-bold"><span className="rounded bg-[#246ce2]/25 px-2 py-1 text-blue-200">가속 {Math.round(accel)}%</span><span className="rounded bg-[#ff4058]/20 px-2 py-1 text-[#ff91a0]">제동 {Math.round(brake)}%</span></div>
      </div>}
    </div>
  );
}
