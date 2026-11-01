"use client";

import { useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import { HeroScene } from "@/components/HeroScene";
import {
  BarsIcon,
  BoltIcon,
  BrakeIcon,
  BulbIcon,
  CalendarIcon,
  CarIcon,
  ChevronIcon,
  ClockIcon,
  FlagIcon,
  GearIcon,
  HomeIcon,
  OverlapIcon,
  PsiLogo,
  RecordIcon,
  RouteIcon,
  ShieldIcon,
} from "@/components/Icons";
import { ChartLegend, LineChart, type Series } from "@/components/LineChart";
import { RadarChart } from "@/components/RadarChart";
import { ReactionBar } from "@/components/ReactionBar";
import { ScoreRing } from "@/components/ScoreRing";
import {
  alerts,
  dataQuality,
  driver,
  habitTips,
  mileage,
  overallScore,
  periodOrder,
  periods,
  reactionPhases,
  scoreHeadline,
  trips,
  weekly,
  type HabitKey,
  type Metric,
  type PeriodKey,
} from "@/lib/sample-data";

const BRAND = "var(--color-brand)";
const COMPARE = "var(--color-compare)";

const metricIcons: Record<Metric["key"], ComponentType<SVGProps<SVGSVGElement>>> = {
  accel: BoltIcon,
  brake: BrakeIcon,
  overlap: OverlapIcon,
  time: ClockIcon,
  distance: RouteIcon,
  events: FlagIcon,
};

const navItems = [
  { label: "대시보드", href: "#top", icon: HomeIcon, active: true },
  { label: "운전 기록", href: "#trips", icon: RecordIcon, active: false },
  { label: "상세 분석", href: "#analysis", icon: BarsIcon, active: false },
];

function Card({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section
      id={id}
      className={`scroll-mt-6 rounded-3xl border border-white bg-card p-5 shadow-[0_6px_24px_rgba(37,70,140,0.07)] sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-bold tracking-tight">{children}</h2>;
}

function MileageCard() {
  const percent = Math.round((mileage.drivenKm / mileage.goalKm) * 100);
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_4px_16px_rgba(37,70,140,0.07)]">
      <p className="text-sm font-semibold">이번 달 주행거리</p>
      <div
        className="mt-2.5 h-2 overflow-hidden rounded-full bg-brand-track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="월간 주행거리 진행률"
      >
        <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-[13px] text-muted">
        <span className="font-bold text-ink">{mileage.drivenKm.toLocaleString("ko-KR")}km</span> /{" "}
        {mileage.goalKm.toLocaleString("ko-KR")}km
      </p>
    </div>
  );
}

function QualityCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-b from-brand-track to-[#c9d9f7] p-4 text-center">
      <ShieldIcon className="mx-auto size-9 text-brand" />
      <p className="mt-2 text-sm font-bold">데이터 품질</p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink/75">
        동기화 {dataQuality.sync}
        <br />
        결측률 {dataQuality.missingRatePct}%
      </p>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col border-r border-white bg-white/70 px-4 py-7 backdrop-blur lg:flex">
      <a href="#top" aria-label="PSI Studio 홈" className="px-3">
        <PsiLogo />
      </a>
      <nav aria-label="주 메뉴" className="mt-9 space-y-1.5">
        {navItems.map(({ label, href, icon: Icon, active }) => (
          <a
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-medium transition-colors ${
              active ? "bg-brand-track font-bold text-brand-deep" : "text-muted hover:bg-brand-track/60 hover:text-ink"
            }`}
          >
            <Icon className="size-5" />
            {label}
          </a>
        ))}
        <span className="flex items-center gap-3 px-4 py-3 text-[15px] font-medium text-muted/70" aria-disabled>
          <GearIcon className="size-5" />
          설정
          <span className="ml-auto rounded-full bg-canvas px-2 py-0.5 text-[11px]">준비 중</span>
        </span>
      </nav>
      <div className="mt-auto space-y-3">
        <MileageCard />
        <QualityCard />
      </div>
    </aside>
  );
}

function MetricTile({ metric }: { metric: Metric }) {
  const Icon = metricIcons[metric.key];
  const isGood = metric.lowerIsBetter === null ? null : metric.lowerIsBetter === metric.changePct < 0;
  const arrow = metric.changePct === 0 ? "" : metric.changePct < 0 ? "↓ " : "↑ ";
  return (
    <div className="rounded-2xl bg-canvas p-3.5">
      <p className="flex items-center gap-1.5 text-[13px] text-muted">
        <Icon className="size-[18px] text-brand" />
        {metric.label}
      </p>
      <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-2">
        <p className="text-[26px] leading-tight font-bold tracking-tight">
          {metric.value}
          <span className="ml-0.5 text-sm font-medium">{metric.unit}</span>
        </p>
        <p
          className={`text-xs font-semibold ${
            isGood === null || metric.changePct === 0 ? "text-muted" : isGood ? "text-good" : "text-alert"
          }`}
        >
          {metric.changePct === 0 ? "변화 없음" : `${arrow}${Math.abs(metric.changePct)}%`}
        </p>
      </div>
    </div>
  );
}

function scorePillClass(score: number) {
  return score >= 80 ? "bg-good-soft text-good" : "bg-caution-soft text-caution";
}

export function Dashboard() {
  const [periodKey, setPeriodKey] = useState<PeriodKey>("30d");
  const [habit, setHabit] = useState<HabitKey | null>(null);
  const period = periods[periodKey];
  const score = overallScore(period.subScores);
  const phases = reactionPhases(period.reactionMs);
  const [recognize, release, transition, rise] = period.reactionMs;
  const reactionStats = [
    { label: "총 제동 반응", span: "T0→T4", ms: recognize + release + transition },
    { label: "인지-해제", span: "T0→T1", ms: recognize },
    { label: "페달 전환", span: "T2→T4", ms: transition },
    { label: "제동력 상승", span: "T4→T5", ms: rise },
  ];

  const trendSeries: Series[] = [
    { name: period.currentName, values: period.trendCurrent, color: BRAND, emphasized: true },
    { name: period.previousName, values: period.trendPrevious, color: COMPARE },
  ];
  const weeklySeries: Series[] = [
    { name: "이번 주", values: weekly.current, color: BRAND, emphasized: true },
    { name: "지난주", values: weekly.previous, color: COMPARE },
  ];

  const ranked = [...period.habits].sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const weakest = ranked[ranked.length - 1];
  const selectedHabit = period.habits.find((item) => item.key === habit);
  const weakestTip = habitTips[weakest.key];

  return (
    <div id="top" className="flex min-h-dvh">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="relative isolate overflow-hidden bg-linear-to-b from-[#d3e2f9] to-canvas pb-12 xl:bg-none xl:pb-20">
          <div className="hidden xl:block">
            <HeroScene />
          </div>
          <div className="relative mx-auto max-w-[1320px] px-4 pt-5 sm:px-8 sm:pt-7">
            <div className="flex items-center justify-between gap-3">
              <a href="#top" aria-label="PSI Studio 홈" className="lg:hidden">
                <PsiLogo />
              </a>
              <div className="ml-auto flex items-center gap-2.5">
                <label className="flex items-center gap-2 rounded-full bg-white/85 px-3.5 py-2 text-sm font-medium shadow-sm backdrop-blur focus-within:outline-2 focus-within:outline-brand">
                  <CalendarIcon className="size-[18px] text-muted" />
                  <span className="sr-only">조회 기간</span>
                  <select
                    value={periodKey}
                    onChange={(event) => setPeriodKey(event.target.value as PeriodKey)}
                    className="cursor-pointer bg-transparent outline-none"
                  >
                    {periodOrder.map((key) => (
                      <option key={key} value={key}>
                        {periods[key].label}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="hidden rounded-full bg-white/85 px-3.5 py-2 text-sm font-medium shadow-sm backdrop-blur sm:block">
                  {driver.id} · {driver.vehicle}
                </span>
              </div>
            </div>
            <div className="mt-5 max-w-[520px] xl:mt-2">
              <h1 className="text-[28px] leading-[1.3] font-extrabold tracking-tight sm:text-[34px]">
                지금까지의 운전 습관,
                <br />
                어떤가요?
              </h1>
              <p className="mt-2.5 text-[15px] text-ink/80">
                PSI가 페달 조작을 밀리초 단위로 분석했어요.
                <span className="ml-2 inline-block rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-white">샘플 데이터</span>
              </p>
            </div>
          </div>
        </header>

        <main className="relative mx-auto -mt-8 max-w-[1320px] space-y-5 px-4 pb-10 sm:px-8">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            <Card className="xl:col-span-8">
              <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[auto_minmax(0,1fr)] 2xl:grid-cols-[auto_minmax(150px,auto)_minmax(0,1fr)]">
                <div className="mx-auto">
                  <ScoreRing score={score} />
                </div>
                <div className="text-center md:text-left">
                  <p className="text-[15px] leading-relaxed">
                    {period.label} 동안의
                    <br />
                    운전 습관은
                  </p>
                  <p className="mt-2 text-[28px] leading-tight font-extrabold tracking-tight text-brand-deep">{scoreHeadline(score)}</p>
                  <p className="mt-3 text-sm text-muted">
                    {period.compareLabel}보다 <span className="font-bold text-good">{period.scoreChange}점 올랐어요 ▲</span>
                  </p>
                </div>
                <div className="min-w-0 border-line md:col-span-2 2xl:col-span-1 2xl:border-l 2xl:pl-6">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-bold">{period.trendTitle}</h2>
                    <ChartLegend series={trendSeries} />
                  </div>
                  <LineChart
                    labels={period.trendLabels}
                    series={trendSeries}
                    height={252}
                    ariaLabel={`${period.trendTitle}. ${period.currentName} 마지막 점수 ${period.trendCurrent[period.trendCurrent.length - 1]}점`}
                  />
                </div>
              </div>
            </Card>

            <Card className="flex flex-col xl:col-span-4">
              <CardTitle>주요 운전 지표</CardTitle>
              <div className="mt-4 grid flex-1 auto-rows-fr grid-cols-2 gap-2.5">
                {period.metrics.map((metric) => (
                  <MetricTile key={metric.key} metric={metric} />
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">증감은 {period.compareLabel} 대비</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            <MileageCard />
            <QualityCard />
          </div>

          <section aria-label="알림" className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {alerts.map((alert) => (
              <article key={alert.title} className="rounded-2xl border border-white bg-card p-4 shadow-[0_4px_16px_rgba(37,70,140,0.06)]">
                <header className="flex items-center gap-2">
                  <span aria-hidden className={`size-2.5 rotate-45 rounded-[2px] ${alert.severity === "alert" ? "bg-alert" : "bg-caution"}`} />
                  <h3 className="font-bold">{alert.title}</h3>
                  <time className="ml-auto text-[13px] whitespace-nowrap text-muted">{alert.when}</time>
                </header>
                <p className="mt-2 text-sm leading-relaxed text-muted">{alert.body}</p>
              </article>
            ))}
          </section>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            <Card id="analysis" className="xl:col-span-6">
              <CardTitle>운전 습관 상세 분석</CardTitle>
              <div className="mt-3.5 flex flex-wrap gap-1.5" role="group" aria-label="항목 선택">
                <button
                  type="button"
                  aria-pressed={habit === null}
                  onClick={() => setHabit(null)}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                    habit === null ? "bg-brand text-white" : "bg-canvas text-muted hover:text-ink"
                  }`}
                >
                  전체
                </button>
                {period.habits.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={habit === item.key}
                    onClick={() => setHabit(item.key)}
                    className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                      habit === item.key ? "bg-brand text-white" : "bg-canvas text-muted hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,1fr)_210px]">
                <RadarChart habits={period.habits} selected={habit} onSelect={setHabit} />
                <div className="rounded-2xl bg-canvas p-4" aria-live="polite">
                  <p className="flex items-center gap-2 font-bold">
                    <BulbIcon className="size-5 text-good" />
                    {selectedHabit ? `${selectedHabit.label} ${selectedHabit.score}점` : "이런 점이 좋아요!"}
                  </p>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink/80">
                    {selectedHabit ? (
                      habitTips[selectedHabit.key].body
                    ) : (
                      <>
                        <b>{best.label}</b>이 {best.score}점으로 가장 안정적이에요. 다음으로 살펴볼 항목은 <b>{weakest.label}</b>({weakest.score}점)이에요.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </Card>

            <Card id="trips" className="xl:col-span-6">
              <CardTitle>최근 운전 기록</CardTitle>
              <ul className="mt-4 space-y-2.5">
                {trips.map((trip) => (
                  <li
                    key={`${trip.date}-${trip.time}`}
                    className="flex items-center gap-3 rounded-2xl border border-line/70 p-3 sm:gap-4 sm:px-4"
                  >
                    <span className="hidden size-11 shrink-0 place-items-center rounded-full bg-canvas text-muted sm:grid">
                      <CarIcon className="size-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold">
                        {trip.date} <span className="ml-1 text-sm font-normal text-muted">{trip.time}</span>
                      </p>
                      <p className="mt-0.5 text-[13px] text-muted">
                        {trip.distanceKm} km · {trip.minutes}분 · 사건 {trip.events}건 · 동기화{" "}
                        <span className={trip.sync === "양호" ? "font-semibold text-good" : "font-semibold text-caution"}>{trip.sync}</span>
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-bold ${scorePillClass(trip.score)}`}>{trip.score}점</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            <Card className="xl:col-span-7">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <CardTitle>사건 반응 시간</CardTitle>
                <p className="text-[13px] text-muted">
                  {period.label} 사건 {period.eventCount}건 평균
                </p>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2.5">
                {reactionStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl bg-canvas p-3.5">
                    <dt className="text-[13px] text-muted">
                      {stat.label} <span className="whitespace-nowrap">({stat.span})</span>
                    </dt>
                    <dd className="mt-1 text-[26px] leading-tight font-bold tracking-tight">
                      {stat.ms}
                      <span className="ml-0.5 text-sm font-medium">ms</span>
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4">
                <ReactionBar phases={phases} />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">T0는 영상에서 표시한 시점이라 약 ±17ms의 불확실성이 있어요.</p>
            </Card>

            <Card id="breakdown" className="xl:col-span-5">
              <CardTitle>세부 점수</CardTitle>
              <ul className="mt-4 space-y-4">
                {period.subScores.map((item) => (
                  <li key={item.key}>
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-[15px] font-semibold">
                        {item.label} <span className="ml-1 text-[13px] font-normal text-muted">비중 {item.weight}%</span>
                      </h3>
                      <span className="font-bold">{item.score}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-brand-track" aria-hidden>
                      <div className="h-full rounded-full bg-brand transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${item.score}%` }} />
                    </div>
                    <p className="mt-1.5 text-[13px] text-muted">{item.description}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            <Card className="xl:col-span-7">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <CardTitle>주간 운전 습관 변화</CardTitle>
                <ChartLegend series={weeklySeries} />
              </div>
              <LineChart
                labels={weekly.labels}
                series={weeklySeries}
                height={200}
                ariaLabel={`요일별 점수. 이번 주 일요일 ${weekly.current[weekly.current.length - 1]}점, 지난주 일요일 ${weekly.previous[weekly.previous.length - 1]}점`}
              />
            </Card>

            <section className="relative isolate flex flex-col justify-center overflow-hidden rounded-3xl bg-linear-to-br from-navy to-[#2f5bb5] p-6 text-white shadow-[0_10px_30px_rgba(16,38,74,0.25)] xl:col-span-5">
              <svg viewBox="0 0 400 240" preserveAspectRatio="xMaxYMax slice" className="absolute inset-0 -z-10 h-full w-full" aria-hidden>
                <path d="M120 240C210 190 300 170 400 158" stroke="#fff" strokeOpacity="0.22" strokeWidth="2" fill="none" />
                <path d="M200 240C270 205 330 192 400 186" stroke="#fff" strokeOpacity="0.22" strokeWidth="2" fill="none" />
                <path d="M160 240C240 198 315 180 400 172" stroke="#fff" strokeOpacity="0.4" strokeWidth="2" strokeDasharray="14 12" fill="none" />
              </svg>
              <ShieldIcon className="absolute top-5 right-5 size-14 text-white/85" />
              <p className="flex items-center gap-2 text-sm font-medium text-white/85">
                <BulbIcon className="size-[18px]" />
                맞춤형 운전 조언
              </p>
              <h2 className="mt-2.5 max-w-[80%] text-[22px] leading-snug font-extrabold tracking-tight">{weakest.label}을 다듬어 볼까요?</h2>
              <p className="mt-2 max-w-[92%] text-sm leading-relaxed text-white/85">{weakestTip.body}</p>
              <a
                href="#analysis"
                className="mt-4 inline-flex w-fit items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy transition-transform hover:translate-x-0.5"
              >
                상세 분석 보기
                <ChevronIcon className="size-4" />
              </a>
            </section>
          </div>

          <footer className="pt-2 text-[13px] leading-relaxed text-muted">
            점수는 운전 행동 지표이며, 사고 원인이나 법적 과실을 판정하지 않습니다. 현재 화면의 수치는 실제 측정값이 아닌 샘플 데이터입니다.
          </footer>
        </main>
      </div>
    </div>
  );
}
