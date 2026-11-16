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
      <PageHeader title="촬영 영상 분석" description="차량과 카메라의 자동 연동이 어려운 현재 단계에서는, 촬영한 전방·페달 영상을 직접 가져와 분석합니다." action={<SampleBadge />} />

      <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#10223f,#173f73_58%,#246ce2)] p-6 text-white shadow-[0_18px_44px_rgba(17,49,92,.2)] sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-[11px] font-bold tracking-[.14em] text-blue-200 uppercase">MVP · Upload-based analysis</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">하드웨어 연동 대신, 촬영 영상을 가져옵니다</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65">두 블랙박스에서 촬영한 파일을 직접 선택하면 전방 객체와 운전자의 발·페달 반응을 연결해 분석합니다.</p></div><button type="button" onClick={() => { setDemo(true); setFiles({ front: null, pedal: null }); setPreviews({ front: null, pedal: null }); setState("idle"); setProgress(0); }} className="rounded-xl bg-white px-4 py-3 text-xs font-extrabold text-brand">데모 영상으로 체험</button></div>
        <div className="mt-6 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 text-center text-[10px] font-bold sm:text-xs"><span className="rounded-xl bg-white/10 px-2 py-3">1. 촬영 파일 가져오기</span><span className="text-white/30">→</span><span className="rounded-xl bg-white/10 px-2 py-3">2. AI 분석</span><span className="text-white/30">→</span><span className="rounded-xl bg-white px-2 py-3 text-brand">3. 장면 확인</span></div>
      </section>

      <section className="grid overflow-hidden rounded-[24px] border border-line bg-white shadow-[0_10px_28px_rgba(15,31,54,.04)] lg:grid-cols-[1fr_auto_1fr]">
        <div className="p-5 sm:p-6"><div className="flex items-center gap-2"><span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-extrabold text-white">현재 MVP</span><h2 className="text-base font-extrabold">촬영 후 파일 분석</h2></div><p className="mt-3 text-sm leading-relaxed text-muted">전방 블랙박스와 페달 카메라에서 영상을 꺼내 웹사이트에 직접 선택합니다. 별도의 차량 통신 장치 없이 분석 기능을 먼저 검증할 수 있습니다.</p><div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold"><span className="rounded-lg bg-[#eef5ff] px-3 py-2 text-brand">MP4·MOV 가져오기</span><span className="rounded-lg bg-[#eef5ff] px-3 py-2 text-brand">촬영 시각 동기화</span><span className="rounded-lg bg-[#eef5ff] px-3 py-2 text-brand">분석 결과 저장</span></div></div>
        <div className="hidden items-center text-2xl text-line lg:flex">→</div>
        <div className="border-t border-line bg-[#f8fafc] p-5 sm:p-6 lg:border-t-0 lg:border-l"><div className="flex items-center gap-2"><span className="rounded-full bg-[#e9edf2] px-2.5 py-1 text-[10px] font-extrabold text-muted">향후 개발</span><h2 className="text-base font-extrabold">카메라 자동 연동</h2></div><p className="mt-3 text-sm leading-relaxed text-muted">차량 탑승 시 두 카메라의 영상을 자동 수집하고 전송합니다. 업로드 단계를 없애려면 전원·저장·통신·동기화 하드웨어 개발이 필요합니다.</p><div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-muted"><span className="rounded-lg bg-white px-3 py-2">자동 전송</span><span className="rounded-lg bg-white px-3 py-2">실시간 동기화</span><span className="rounded-lg bg-white px-3 py-2">차량 장착 장치</span></div></div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <UploadCard kind="front" file={files.front} preview={previews.front} demo={demo} onFile={(file) => chooseFile("front", file)} />
        <UploadCard kind="pedal" file={files.pedal} preview={previews.pedal} demo={demo} onFile={(file) => chooseFile("pedal", file)} />
      </section>

      {state === "idle" && <section className="rounded-2xl border border-line bg-white p-5 text-center shadow-[0_10px_28px_rgba(15,31,54,.04)] sm:p-6"><p className="text-sm font-bold">촬영한 전방 영상과 페달 영상이 모두 필요합니다</p><p className="mt-1 text-xs text-muted">파일의 촬영 시작 시각을 먼저 맞추고, 영상 속 움직임을 이용해 오차를 보정하는 방식을 가정합니다.</p><button type="button" disabled={!ready} onClick={start} className="mt-5 min-h-12 rounded-xl bg-brand px-7 text-sm font-extrabold text-white shadow-[0_8px_22px_rgba(36,108,226,.2)] disabled:cursor-not-allowed disabled:bg-[#b8c4d3] disabled:shadow-none">가져온 영상 분석 시작</button></section>}

      {state === "analyzing" && <section className="rounded-[28px] border border-line bg-white p-5 shadow-[0_12px_34px_rgba(15,31,54,.06)] sm:p-7"><div className="flex items-center justify-between"><div><p className="text-[11px] font-bold tracking-[.12em] text-brand uppercase">Analyzing</p><h2 className="mt-1 text-xl font-extrabold">영상을 분석하고 있어요</h2></div><p className="text-3xl font-black text-brand tabular-nums">{progress}%</p></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-[#e8eef5]"><div className="h-full rounded-full bg-[linear-gradient(90deg,#246ce2,#31b5e8)] transition-[width] duration-150" style={{ width: `${progress}%` }} /></div><ol className="mt-6 grid gap-2 sm:grid-cols-5">{stages.map((stage, index) => { const active = progress >= index * 20; const done = progress >= (index + 1) * 20; return <li key={stage} className={`rounded-xl border p-3 text-xs font-bold ${active ? "border-[#bfd5f6] bg-[#f2f7ff] text-brand" : "border-line text-muted"}`}><span className={`mr-2 inline-grid size-5 place-items-center rounded-full text-[10px] ${done ? "bg-brand text-white" : active ? "bg-[#dceaff]" : "bg-canvas"}`}>{done ? "✓" : index + 1}</span>{stage}</li>; })}</ol><p className="mt-4 text-center text-[11px] text-muted">이 화면은 제품 동작을 설명하는 시연 분석입니다.</p></section>}

      {state === "complete" && <section className="space-y-4 rounded-[28px] border border-[#cce9db] bg-[#f7fcf9] p-5 shadow-[0_12px_34px_rgba(15,31,54,.06)] sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[11px] font-bold tracking-[.12em] text-good uppercase">Analysis complete</p><h2 className="mt-1 text-2xl font-black">분석이 완료됐어요</h2><p className="mt-2 text-sm text-muted">대표 위험 장면 3개와 객체·페달 반응 구간을 생성했습니다.</p></div><button type="button" onClick={() => { setState("idle"); setProgress(0); }} className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-muted">다시 분석</button></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><div className="rounded-xl bg-white p-4"><p className="text-[10px] text-muted">영상 동기화</p><p className="mt-1 text-xl font-black">±4ms</p></div><div className="rounded-xl bg-white p-4"><p className="text-[10px] text-muted">추적 객체</p><p className="mt-1 text-xl font-black">4개</p></div><div className="rounded-xl bg-white p-4"><p className="text-[10px] text-muted">위험 장면</p><p className="mt-1 text-xl font-black">3개</p></div><div className="rounded-xl bg-white p-4"><p className="text-[10px] text-muted">분석 상태</p><p className="mt-1 text-xl font-black text-good">완료</p></div></div><ObjectDetectionView event={sampleEvent} playheadMs={1800} durationMs={(sampleEvent.series.accel.length - 1) * 20} accel={sampleEvent.series.accel[sampleIndex]} brake={sampleEvent.series.brake[sampleIndex]} /><Link href="/events?id=E04" className="flex min-h-12 items-center justify-center gap-1 rounded-xl bg-brand px-5 text-sm font-extrabold text-white">분석된 주행 장면 보기 <ChevronIcon className="size-4" /></Link></section>}

      <p className="text-center text-[11px] leading-relaxed text-muted">현재 웹 프로토타입에서는 선택한 영상이 서버로 전송되지 않습니다. 실제 업로드·저장·AI 처리 서버는 MVP 구현 단계에서 별도로 개발해야 하며, 화면의 분석 결과는 시연 데이터입니다.</p>
    </>
  );
}
