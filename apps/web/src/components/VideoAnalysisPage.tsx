"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { CameraIcon, ChevronIcon, PlayIcon } from "@/components/Icons";
import { ObjectDetectionView } from "@/components/ObjectDetectionView";
import { PageHeader, SampleBadge } from "@/components/ui";
import { pedalSamples } from "@/lib/pedal";

type UploadKind = "front" | "pedal";
type AnalysisState = "idle" | "analyzing" | "complete";

const stages = ["영상 정보 확인", "두 영상 시간 동기화", "전방 객체 탐지·추적", "발·페달 움직임 추출", "위험 장면과 점수 생성"];

function UploadCard({ kind, file, preview, demo, onFile }: { kind: UploadKind; file: File | null; preview: string | null; demo: boolean; onFile: (file: File) => void }) {
  const isFront = kind === "front";
  const title = isFront ? "전방 블랙박스" : "페달 블랙박스";
  const inputId = `${kind}-video`;
  const selected = Boolean(file || demo);
  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const dropped = event.dataTransfer.files[0];
    if (dropped?.type.startsWith("video/")) onFile(dropped);
  };

  return (
    <article className={`overflow-hidden rounded-2xl border-2 bg-white transition ${selected ? "border-brand shadow-[0_10px_28px_rgba(36,108,226,.1)]" : "border-dashed border-[#cbd6e4]"}`}>
      <div className="flex items-center justify-between border-b border-line/80 px-4 py-3">
        <div className="flex items-center gap-2"><span className={`grid size-8 place-items-center rounded-lg ${isFront ? "bg-[#eaf2ff] text-brand" : "bg-[#f4f0ff] text-[#7c3aed]"}`}><CameraIcon className="size-4" /></span><div><h2 className="text-sm font-extrabold">{title}</h2><p className="text-[10px] text-muted">{isFront ? "도로·차량·보행자 인식" : "발 위치·페달 조작 인식"}</p></div></div>
        {selected && <span className="rounded-full bg-good-soft px-2.5 py-1 text-[10px] font-bold text-good">준비 완료</span>}
      </div>
      {preview ? <div className="relative aspect-video bg-black"><video src={preview} controls muted playsInline className="size-full object-contain" /><span className="absolute top-2 left-2 rounded bg-black/60 px-2 py-1 text-[9px] font-bold text-white">업로드 미리보기</span></div> : demo ? <div className={`relative grid aspect-video place-items-center overflow-hidden ${isFront ? "bg-[linear-gradient(#7894ad_0_48%,#283746_48%)]" : "bg-[linear-gradient(145deg,#e9eff6,#cbd8e6)]"}`}><div className="text-center text-white"><span className="mx-auto grid size-12 place-items-center rounded-full bg-black/25"><PlayIcon className="size-5" /></span><p className="mt-2 text-xs font-bold">데모 영상 선택됨</p></div></div> : <label htmlFor={inputId} onDragOver={(event) => event.preventDefault()} onDrop={onDrop} className="grid aspect-video cursor-pointer place-items-center p-5 text-center transition hover:bg-[#f7faff]"><span><span className="mx-auto grid size-12 place-items-center rounded-full bg-canvas text-brand"><span className="text-2xl font-light">＋</span></span><b className="mt-3 block text-sm">영상 선택 또는 끌어놓기</b><span className="mt-1 block text-[11px] text-muted">MP4, MOV · 브라우저 미리보기</span></span></label>}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="min-w-0 truncate text-[11px] text-muted">{file?.name ?? (demo ? `${kind}_camera_demo.mp4` : "선택된 파일 없음")}</p>
        <label htmlFor={inputId} className="shrink-0 cursor-pointer rounded-lg bg-canvas px-3 py-2 text-[11px] font-bold text-brand">{selected ? "다시 선택" : "파일 선택"}</label>
        <input id={inputId} type="file" accept="video/mp4,video/quicktime,video/*" className="sr-only" onChange={(event) => { const next = event.target.files?.[0]; if (next) onFile(next); }} />
      </div>
    </article>
  );
}

export function VideoAnalysisPage() {
  const [files, setFiles] = useState<Record<UploadKind, File | null>>({ front: null, pedal: null });
  const [previews, setPreviews] = useState<Record<UploadKind, string | null>>({ front: null, pedal: null });
  const [demo, setDemo] = useState(false);
  const [state, setState] = useState<AnalysisState>("idle");
  const [progress, setProgress] = useState(0);
  const urls = useRef<string[]>([]);
  const ready = demo || Boolean(files.front && files.pedal);
  const sampleEvent = pedalSamples.events.find((event) => event.id === "E04") ?? pedalSamples.events[0];
  const sampleIndex = Math.min(90, sampleEvent.series.accel.length - 1);

  useEffect(() => () => urls.current.forEach((url) => URL.revokeObjectURL(url)), []);
  useEffect(() => {
    if (state !== "analyzing") return;
    const timer = window.setInterval(() => setProgress((current) => {
      const next = Math.min(100, current + 4);
      if (next === 100) {
        window.clearInterval(timer);
        window.setTimeout(() => setState("complete"), 250);
      }
      return next;
    }), 110);
    return () => window.clearInterval(timer);
  }, [state]);

  const chooseFile = (kind: UploadKind, file: File) => {
    const previous = previews[kind];
    if (previous) URL.revokeObjectURL(previous);
    const url = URL.createObjectURL(file);
    urls.current.push(url);
    setFiles((current) => ({ ...current, [kind]: file }));
    setPreviews((current) => ({ ...current, [kind]: url }));
    setDemo(false);
    setState("idle");
    setProgress(0);
  };

  const start = () => {
    if (!ready) return;
    setProgress(4);
    setState("analyzing");
  };

  return (
    <>
      <PageHeader title="블랙박스 영상 분석" description="전방 영상과 페달 영상을 함께 올리면 같은 시간축으로 맞춘 뒤 객체와 운전자 반응을 분석합니다." action={<SampleBadge />} />

      <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#10223f,#173f73_58%,#246ce2)] p-6 text-white shadow-[0_18px_44px_rgba(17,49,92,.2)] sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-[11px] font-bold tracking-[.14em] text-blue-200 uppercase">Video analysis workflow</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">두 영상을 올리면 분석이 시작됩니다</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65">전방 객체가 나타난 순간과 운전자의 발·페달 반응을 연결해 위험 장면을 자동으로 만듭니다.</p></div><button type="button" onClick={() => { setDemo(true); setFiles({ front: null, pedal: null }); setPreviews({ front: null, pedal: null }); setState("idle"); setProgress(0); }} className="rounded-xl bg-white px-4 py-3 text-xs font-extrabold text-brand">데모 영상으로 체험</button></div>
        <div className="mt-6 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 text-center text-[10px] font-bold sm:text-xs"><span className="rounded-xl bg-white/10 px-2 py-3">1. 영상 업로드</span><span className="text-white/30">→</span><span className="rounded-xl bg-white/10 px-2 py-3">2. AI 분석</span><span className="text-white/30">→</span><span className="rounded-xl bg-white px-2 py-3 text-brand">3. 장면 확인</span></div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <UploadCard kind="front" file={files.front} preview={previews.front} demo={demo} onFile={(file) => chooseFile("front", file)} />
        <UploadCard kind="pedal" file={files.pedal} preview={previews.pedal} demo={demo} onFile={(file) => chooseFile("pedal", file)} />
      </section>

      {state === "idle" && <section className="rounded-2xl border border-line bg-white p-5 text-center shadow-[0_10px_28px_rgba(15,31,54,.04)] sm:p-6"><p className="text-sm font-bold">전방 영상과 페달 영상이 모두 필요합니다</p><p className="mt-1 text-xs text-muted">두 영상은 촬영 시각을 기준으로 자동 동기화하는 흐름을 가정합니다.</p><button type="button" disabled={!ready} onClick={start} className="mt-5 min-h-12 rounded-xl bg-brand px-7 text-sm font-extrabold text-white shadow-[0_8px_22px_rgba(36,108,226,.2)] disabled:cursor-not-allowed disabled:bg-[#b8c4d3] disabled:shadow-none">영상 분석 시작</button></section>}

      {state === "analyzing" && <section className="rounded-[28px] border border-line bg-white p-5 shadow-[0_12px_34px_rgba(15,31,54,.06)] sm:p-7"><div className="flex items-center justify-between"><div><p className="text-[11px] font-bold tracking-[.12em] text-brand uppercase">Analyzing</p><h2 className="mt-1 text-xl font-extrabold">영상을 분석하고 있어요</h2></div><p className="text-3xl font-black text-brand tabular-nums">{progress}%</p></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-[#e8eef5]"><div className="h-full rounded-full bg-[linear-gradient(90deg,#246ce2,#31b5e8)] transition-[width] duration-150" style={{ width: `${progress}%` }} /></div><ol className="mt-6 grid gap-2 sm:grid-cols-5">{stages.map((stage, index) => { const active = progress >= index * 20; const done = progress >= (index + 1) * 20; return <li key={stage} className={`rounded-xl border p-3 text-xs font-bold ${active ? "border-[#bfd5f6] bg-[#f2f7ff] text-brand" : "border-line text-muted"}`}><span className={`mr-2 inline-grid size-5 place-items-center rounded-full text-[10px] ${done ? "bg-brand text-white" : active ? "bg-[#dceaff]" : "bg-canvas"}`}>{done ? "✓" : index + 1}</span>{stage}</li>; })}</ol><p className="mt-4 text-center text-[11px] text-muted">이 화면은 제품 동작을 설명하는 시연 분석입니다.</p></section>}

      {state === "complete" && <section className="space-y-4 rounded-[28px] border border-[#cce9db] bg-[#f7fcf9] p-5 shadow-[0_12px_34px_rgba(15,31,54,.06)] sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[11px] font-bold tracking-[.12em] text-good uppercase">Analysis complete</p><h2 className="mt-1 text-2xl font-black">분석이 완료됐어요</h2><p className="mt-2 text-sm text-muted">대표 위험 장면 3개와 객체·페달 반응 구간을 생성했습니다.</p></div><button type="button" onClick={() => { setState("idle"); setProgress(0); }} className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-muted">다시 분석</button></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><div className="rounded-xl bg-white p-4"><p className="text-[10px] text-muted">영상 동기화</p><p className="mt-1 text-xl font-black">±4ms</p></div><div className="rounded-xl bg-white p-4"><p className="text-[10px] text-muted">추적 객체</p><p className="mt-1 text-xl font-black">4개</p></div><div className="rounded-xl bg-white p-4"><p className="text-[10px] text-muted">위험 장면</p><p className="mt-1 text-xl font-black">3개</p></div><div className="rounded-xl bg-white p-4"><p className="text-[10px] text-muted">분석 상태</p><p className="mt-1 text-xl font-black text-good">완료</p></div></div><ObjectDetectionView event={sampleEvent} playheadMs={1800} durationMs={(sampleEvent.series.accel.length - 1) * 20} accel={sampleEvent.series.accel[sampleIndex]} brake={sampleEvent.series.brake[sampleIndex]} /><Link href="/events?id=E04" className="flex min-h-12 items-center justify-center gap-1 rounded-xl bg-brand px-5 text-sm font-extrabold text-white">분석된 주행 장면 보기 <ChevronIcon className="size-4" /></Link></section>}

      <p className="text-center text-[11px] leading-relaxed text-muted">현재 프로토타입에서는 선택한 영상이 서버로 전송되지 않으며, 분석 과정과 결과는 시연 데이터로 표현됩니다.</p>
    </>
  );
}
