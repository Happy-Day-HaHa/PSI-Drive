import type { ReactNode } from "react";

export function Panel({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`scroll-mt-20 rounded-xl border border-line bg-card p-5 sm:p-6 ${className}`}>
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
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line pb-5">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted">{description}</p>
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
    <span className="rounded border border-line bg-canvas px-2 py-0.5 text-xs font-medium whitespace-nowrap text-muted">샘플 데이터</span>
  );
}
