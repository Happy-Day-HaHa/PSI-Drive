import Link from "next/link";
import { BarsIcon, CarIcon, ChevronIcon, UserIcon } from "@/components/Icons";
import { DeviceOverview } from "@/components/DeviceOverview";
import { SampleBadge } from "@/components/ui";
import { dataHealth, driver, inspection } from "@/lib/sample-data";

const preferences = [
  { label: "주간 운전 리포트", value: "매주 월요일", detail: "지난 한 주의 점수 변화와 운전 습관을 알려드려요." },
  { label: "주행 알림", value: "켜짐", detail: "새 주행 기록이 준비되면 알려드려요." },
  { label: "데이터 보관", value: "최근 90일", detail: "연결된 기기의 주행 데이터를 안전하게 보관해요." },
];

export function ProfilePage() {
  return (
    <div className="space-y-5">
      <header className="overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#0b1e36_0%,#173f73_68%,#2869b8_100%)] px-5 py-6 text-white shadow-[0_18px_42px_rgba(11,30,54,.18)] sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-[20px] border border-white/15 bg-white/10 text-blue-100 shadow-inner backdrop-blur sm:size-20">
              <UserIcon className="size-8 sm:size-10" />
            </span>
            <div>
              <div className="flex items-center gap-2"><p className="text-[11px] font-bold tracking-[.14em] text-blue-200 uppercase">My PSI Studio</p><span className="rounded border border-white/15 bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/70">데모 계정</span></div>
              <h1 className="mt-1 text-2xl font-extrabold tracking-[-.02em] sm:text-3xl">나의 운전 공간</h1>
              <p className="mt-1.5 text-xs text-white/65 sm:text-sm">{driver.id} · 2026년 10월부터 함께하고 있어요</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-[270px]">
            <div className="rounded-xl border border-white/10 bg-white/[.08] px-3.5 py-3 backdrop-blur">
              <p className="text-[10px] text-white/55">내 차량</p>
              <p className="mt-1 truncate text-sm font-bold">{driver.vehicleModel}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[.08] px-3.5 py-3 backdrop-blur">
              <p className="text-[10px] text-white/55">다음 점검</p>
              <p className="mt-1 text-sm font-bold">D-{inspection.daysLeft}</p>
            </div>
          </div>
        </div>
      </header>

      <section aria-labelledby="quick-title" className="rounded-2xl border border-line/90 bg-white p-4 shadow-[0_10px_28px_rgba(15,31,54,.04)] sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[.12em] text-brand uppercase">바로가기</p>
            <h2 id="quick-title" className="mt-1 text-lg font-bold">필요한 내용을 빠르게 확인해요</h2>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Link href="/dashboard" className="group flex min-h-20 items-center gap-3 rounded-xl bg-[#f4f7fb] p-3.5 transition hover:bg-[#eaf2fb]">
            <span className="flex size-9 items-center justify-center rounded-lg bg-white text-brand shadow-sm"><BarsIcon className="size-5" /></span>
            <span className="text-xs font-bold sm:text-sm">내 점수 보기</span>
          </Link>
          <Link href="/events" className="group flex min-h-20 items-center gap-3 rounded-xl bg-[#f4f7fb] p-3.5 transition hover:bg-[#eaf2fb]">
            <span className="flex size-9 items-center justify-center rounded-lg bg-white text-brand shadow-sm"><CarIcon className="size-5" /></span>
            <span className="text-xs font-bold sm:text-sm">최근 주행 보기</span>
          </Link>
          <div className="col-span-2 flex min-h-20 items-center justify-between rounded-xl bg-good-soft/70 p-3.5 sm:col-span-1">
            <div><p className="text-[10px] font-semibold text-good">연결 상태</p><p className="mt-1 text-xs font-bold sm:text-sm">모든 기기 정상</p></div>
            <span className="size-2.5 rounded-full bg-good shadow-[0_0_0_5px_rgba(18,114,79,.1)]" />
          </div>
        </div>
      </section>

      <div>
        <div className="mb-3 px-1">
          <p className="text-[11px] font-bold tracking-[.12em] text-brand uppercase">Vehicle & Device</p>
          <h2 className="mt-1 text-xl font-extrabold">내 차량과 연결 기기</h2>
          <p className="mt-1 text-xs text-muted">차량 정보와 블랙박스·센서 상태를 한곳에서 확인할 수 있어요.</p>
        </div>
        <DeviceOverview />
      </div>

      <section className="overflow-hidden rounded-2xl border border-line/90 bg-white shadow-[0_10px_28px_rgba(15,31,54,.04)]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line/80 px-5 py-4 sm:px-6">
          <div><div className="flex items-center gap-2"><p className="text-[11px] font-bold tracking-[.12em] text-brand uppercase">Data health</p><SampleBadge /></div><h2 className="mt-1 text-lg font-bold">분석 데이터 상태</h2><p className="mt-1 text-xs text-muted">측정된 범위와 누락 여부를 먼저 확인할 수 있어요.</p></div>
          <span className="flex items-center gap-1.5 rounded-full bg-good-soft px-2.5 py-1 text-[11px] font-bold text-good"><span className="size-2 rounded-full bg-good" />분석 가능</span>
        </div>
        <div className="grid md:grid-cols-[minmax(0,1.2fr)_minmax(260px,.8fr)]">
          <div className="grid grid-cols-2 gap-px bg-line/80 md:grid-cols-4">
            <div className="bg-white p-4 sm:p-5"><p className="text-[10px] text-muted">마지막 동기화</p><p className="mt-1 text-sm font-bold">11월 1일</p><p className="mt-0.5 text-[10px] text-muted">오후 7:43</p></div>
            <div className="bg-white p-4 sm:p-5"><p className="text-[10px] text-muted">센서 수집률</p><p className="mt-1 text-xl font-extrabold text-good tabular-nums">{dataHealth.sensorCoveragePct}%</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-track"><div className="h-full rounded-full bg-good" style={{ width: `${dataHealth.sensorCoveragePct}%` }} /></div></div>
            <div className="bg-white p-4 sm:p-5"><p className="text-[10px] text-muted">영상 수집률</p><p className="mt-1 text-xl font-extrabold text-brand tabular-nums">{dataHealth.videoCoveragePct}%</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-track"><div className="h-full rounded-full bg-data" style={{ width: `${dataHealth.videoCoveragePct}%` }} /></div></div>
            <div className="bg-white p-4 sm:p-5"><p className="text-[10px] text-muted">저장 데이터</p><p className="mt-1 text-sm font-bold tabular-nums">{dataHealth.storageUsedGb}GB</p><p className="mt-0.5 text-[10px] text-muted">전체 {dataHealth.storageTotalGb}GB</p></div>
          </div>
          <div className="border-t border-line/80 bg-[#fffaf3] p-5 md:border-t-0 md:border-l sm:p-6">
            <div className="flex items-start gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-caution-soft font-bold text-caution">!</span><div><p className="text-sm font-bold">영상 누락 구간 {dataHealth.missingSegments}개</p><p className="mt-1 text-xs leading-relaxed text-muted">10월 18일 페달 영상 약 14초가 포함되지 않았어요. 해당 구간은 센서 데이터만 분석에 사용됩니다.</p></div></div>
            <dl className="mt-4 border-t border-[#eadcc8] pt-3 text-[11px]"><div className="flex justify-between gap-3"><dt className="text-muted">분석 가능 기간</dt><dd className="font-semibold">{dataHealth.analysisRange}</dd></div><div className="mt-2 flex justify-between gap-3"><dt className="text-muted">전체 동기화</dt><dd className="font-semibold">{dataHealth.lastSync}</dd></div></dl>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,.55fr)]">
        <div className="rounded-2xl border border-line/90 bg-white p-5 shadow-[0_10px_28px_rgba(15,31,54,.04)] sm:p-6">
          <p className="text-[11px] font-bold tracking-[.12em] text-brand uppercase">내 설정</p>
          <h2 className="mt-1 text-lg font-bold">알림과 데이터</h2>
          <div className="mt-4 divide-y divide-line/80">
            {preferences.map((item) => (
              <div key={item.label} className="flex items-center gap-3 py-3.5 first:pt-1 last:pb-1">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{item.label}</p>
                  <p className="mt-0.5 truncate text-[11px] text-muted">{item.detail}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#eef4fb] px-2.5 py-1 text-[11px] font-bold text-brand">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-line/90 bg-white p-5 shadow-[0_10px_28px_rgba(15,31,54,.04)] sm:p-6">
          <p className="text-[11px] font-bold tracking-[.12em] text-brand uppercase">계정</p>
          <h2 className="mt-1 text-lg font-bold">내 정보 관리</h2>
          <div className="mt-4 space-y-1">
            <div className="flex items-center justify-between rounded-xl px-2 py-3 text-sm"><span>운전자 ID</span><b className="text-xs">{driver.id}</b></div>
            <details className="group rounded-xl px-2 py-3 text-sm open:bg-canvas"><summary className="flex cursor-pointer list-none items-center justify-between marker:hidden"><span>데이터 및 개인정보</span><ChevronIcon className="size-4 text-muted transition group-open:rotate-90" /></summary><p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">현재 화면은 샘플 계정입니다. 실제 서비스 연결 시 영상 보관 기간, 분석 동의 범위, 데이터 내려받기와 삭제 기능을 이 영역에서 관리합니다.</p></details>
            <Link href="/" className="flex items-center justify-between rounded-xl px-2 py-3 text-sm text-muted transition hover:bg-canvas hover:text-ink"><span>로그아웃</span><ChevronIcon className="size-4" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
