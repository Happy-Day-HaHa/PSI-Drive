import Link from "next/link";
import type { ReactNode } from "react";

export function Panel({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`scroll-mt-20 rounded-2xl border border-line/90 bg-card p-5 shadow-[0_1px_2px_rgba(15,31,54,0.03),0_12px_32px_rgba(15,31,54,0.035)] sm:p-6 ${className}`}>
      {children}
    </section>
  );
}

export function PanelHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <h2 className="text-base font-bold">{title}</h2>
        {description && <p className="mt-1 text-[13px] leading-relaxed text-muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line/80 pb-5">
      <div className="min-w-0">
        <p className="mb-1.5 text-[11px] font-bold tracking-[0.16em] text-brand uppercase">PSI Studio</p>
        <h1 className="text-[25px] font-bold tracking-[-0.025em] sm:text-[28px]">{title}</h1>
        <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-muted sm:text-sm">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, unit, note, noteTone }: { label: string; value: string; unit?: string; note?: string; noteTone?: "good" | "alert" | "muted" }) {
  const tone = noteTone === "good" ? "text-good" : noteTone === "alert" ? "text-alert" : "text-muted";
  return (
    <div className="min-w-0">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="mt-1.5 text-2xl leading-tight font-bold tracking-tight">
        {value}
        {unit && <span className="ml-0.5 text-sm font-medium text-muted">{unit}</span>}
      </dd>
      {note && <dd className={`mt-1 text-xs font-medium ${tone}`}>{note}</dd>}
    </div>
  );
}

export function SampleBadge() {
  return (
    <span className="rounded border border-[#c8d9ef] bg-[#f3f7fd] px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-brand">합성 검증 데이터</span>
  );
}

export function EvidenceDisclosure({
  source,
  configVersion,
  sessions,
  events,
  seeds,
  sampleIntervalMs,
  formula,
  limitation,
}: {
  source: string;
  configVersion: string;
  sessions: number;
  events: number;
  seeds: number[];
  sampleIntervalMs: number;
  formula: string;
  limitation: string;
}) {
  return (
    <details className="group rounded-xl border border-[#d7e4f5] bg-[#f7faff] text-xs text-muted">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden">
        <span><b className="text-ink">수치 산출 근거</b> · 생성 원본과 계산 기준 확인</span>
        <span className="font-bold text-brand group-open:hidden">열기</span>
        <span className="hidden font-bold text-brand group-open:inline">닫기</span>
      </summary>
      <dl className="grid gap-3 border-t border-[#d7e4f5] px-4 py-4 sm:grid-cols-2">
        <div><dt className="font-semibold text-ink">데이터 원본</dt><dd className="mt-1 leading-relaxed">{source} · 고정 시드 {seeds.join(", ")}</dd></div>
        <div><dt className="font-semibold text-ink">분석 범위</dt><dd className="mt-1 leading-relaxed">합성 세션 {sessions}개 · 주의 장면 {events}건 · {sampleIntervalMs}ms 간격 표본</dd></div>
        <div><dt className="font-semibold text-ink">점수 산식</dt><dd className="mt-1 leading-relaxed">{formula} · 설정 {configVersion}</dd></div>
        <div><dt className="font-semibold text-ink">해석 한계</dt><dd className="mt-1 leading-relaxed">{limitation}</dd></div>
      </dl>
      <div className="border-t border-[#d7e4f5] px-4 py-3 text-right"><Link href="/evidence" className="font-bold text-brand underline decoration-brand/25 underline-offset-2">전체 수치와 출처 보기</Link></div>
    </details>
  );
}
