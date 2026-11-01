import type { ReactNode } from "react";
import { ScoreGauge } from "@/components/ScoreGauge";
import {
  alerts,
  driver,
  mileage,
  overallScore,
  scoreChange,
  subScores,
  trips,
  type Alert,
  type Trip,
} from "@/lib/sample-data";

function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function AlertCard({ alert }: { alert: Alert }) {
  const color = alert.severity === "alert" ? "bg-alert" : "bg-caution";
  return (
    <article className="w-[78%] shrink-0 snap-start rounded-2xl border border-line bg-white p-4 md:w-auto">
      <header className="flex items-center gap-2">
        <span aria-hidden className={`size-2.5 rotate-45 rounded-[2px] ${color}`} />
        <h3 className="font-semibold">{alert.title}</h3>
        <time className="ml-auto text-sm whitespace-nowrap text-muted">{alert.when}</time>
      </header>
      <p className="mt-2.5 text-[15px] leading-relaxed text-muted">{alert.body}</p>
    </article>
  );
}

function TripCard({ trip }: { trip: Trip }) {
  return (
    <article className="w-[78%] shrink-0 snap-start rounded-2xl border border-line bg-white p-4 md:w-auto">
      <header className="flex items-baseline justify-between">
        <span className="text-sm text-muted">
          {trip.date} · {trip.distanceKm}km
        </span>
        <span className="font-semibold">{trip.minutes}분</span>
      </header>
      <ol className="mt-3 space-y-2 border-l-2 border-line pl-3.5 text-[15px]">
        <li className="relative before:absolute before:top-[7px] before:-left-[20px] before:size-2.5 before:rounded-full before:bg-navy">
          {trip.departure} 출발
        </li>
        <li className="relative before:absolute before:top-[7px] before:-left-[20px] before:size-2.5 before:rounded-full before:bg-mint">
          {trip.arrival} 도착
        </li>
      </ol>
      <dl className="mt-4 grid grid-cols-3 border-t border-line pt-3 text-center">
        <div>
          <dt className="text-xs text-muted">점수</dt>
          <dd className="mt-0.5 font-bold tabular-nums">{trip.score}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">사건</dt>
          <dd className="mt-0.5 font-bold tabular-nums">{trip.events}건</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">동기화</dt>
          <dd className={`mt-0.5 font-bold ${trip.sync === "양호" ? "text-mint-deep" : "text-caution"}`}>{trip.sync}</dd>
        </div>
      </dl>
    </article>
  );
}

export default function DashboardPage() {
  const mileagePercent = Math.round((mileage.drivenKm / mileage.goalKm) * 100);
  return (
    <div className="min-h-dvh">
      <div className="bg-navy pb-20 text-white">
        <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-5">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-mint text-sm font-black text-navy">
              P
            </span>
            <span className="text-lg font-bold tracking-tight">PSI Studio</span>
          </div>
          <div className="rounded-full bg-navy-soft px-3.5 py-1.5 text-sm font-medium">
            {driver.id} · {driver.vehicle}
          </div>
        </header>
        <div className="mx-auto mt-7 max-w-5xl px-5 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <h1 className="text-sm font-medium text-white/75">운전 습관 종합 점수</h1>
            <span className="rounded-full bg-navy-soft px-2.5 py-0.5 text-xs font-medium text-white/85">샘플 데이터</span>
          </div>
          <ScoreGauge score={overallScore} change={scoreChange} />
          <a href="#breakdown" className="mt-3 inline-block text-sm font-medium underline underline-offset-4">
            세부 점수 보기
          </a>
        </div>
      </div>

      <main className="mx-auto -mt-14 max-w-5xl space-y-8 px-5 pb-10">
        <section className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(16,38,74,0.10)]">
          <h2 className="text-lg font-bold">이번 달 주행거리</h2>
          <div
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuenow={mileagePercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="월간 주행거리 진행률"
          >
            <div className="h-full rounded-full bg-navy" style={{ width: `${mileagePercent}%` }} />
          </div>
          <p className="mt-2.5 text-[15px] text-muted">
            <span className="font-semibold text-ink tabular-nums">{mileage.drivenKm.toLocaleString("ko-KR")}km</span> /{" "}
            <span className="tabular-nums">{mileage.goalKm.toLocaleString("ko-KR")}km</span> 주행
          </p>
        </section>

        <Section title="알림">
          <div className="-mx-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
            {alerts.map((alert) => (
              <AlertCard key={alert.title} alert={alert} />
            ))}
          </div>
        </Section>

        <Section title="세부 점수" id="breakdown">
          <div className="grid gap-x-10 gap-y-5 rounded-2xl border border-line bg-white p-5 md:grid-cols-2">
            {subScores.map((item) => (
              <div key={item.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-semibold">
                    {item.label} <span className="ml-1 text-sm font-normal text-muted">비중 {item.weight}%</span>
                  </h3>
                  <span className="text-lg font-bold tabular-nums">{item.score}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" aria-hidden>
                  <div className="h-full rounded-full bg-mint-deep" style={{ width: `${item.score}%` }} />
                </div>
                <p className="mt-2 text-sm text-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="최근 주행">
          <div className="-mx-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
            {trips.map((trip) => (
              <TripCard key={`${trip.date}-${trip.departure}`} trip={trip} />
            ))}
          </div>
        </Section>

        <footer className="border-t border-line pt-5 text-sm leading-relaxed text-muted">
          점수는 운전 행동 지표이며, 사고 원인이나 법적 과실을 판정하지 않습니다. 현재 화면의 수치는 실제 측정값이 아닌 샘플 데이터입니다.
        </footer>
      </main>
    </div>
  );
}
