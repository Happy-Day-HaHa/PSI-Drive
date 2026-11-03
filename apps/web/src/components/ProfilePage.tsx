import Link from "next/link";
import { BatteryIcon, CarIcon, ChevronIcon, UserIcon } from "@/components/Icons";
import { DeviceOverview } from "@/components/DeviceOverview";
import { SampleBadge } from "@/components/ui";
import { dataHealth, devices, driver, inspection } from "@/lib/sample-data";

const preferences = [
  { label: "주간 운전 리포트", value: "매주 월요일", detail: "지난 한 주의 점수 변화를 알려드려요." },
  { label: "주행 알림", value: "켜짐", detail: "새 주행 기록이 준비되면 알려드려요." },
  { label: "데이터 보관", value: "최근 90일", detail: "연결 기기의 주행 데이터를 보관해요." },
];

const lowestBattery = Math.min(...devices.map((device) => device.battery));

export function ProfilePage() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <header className="rounded-[24px] border border-line/90 bg-white px-5 py-5 shadow-[0_12px_34px_rgba(15,31,54,.05)] sm:px-7 sm:py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf3ff] text-brand sm:size-14">
              <UserIcon className="size-6 sm:size-7" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-[-.02em] sm:text-2xl">마이페이지</h1>
                <SampleBadge />
              </div>
              <p className="mt-1 truncate text-xs text-muted sm:text-sm">{driver.vehicleModel} · {driver.plate}</p>
            </div>
          </div>
          <span className="hidden items-center gap-2 rounded-full bg-good-soft px-3 py-2 text-xs font-bold text-good sm:flex">
            <span className="size-2 rounded-full bg-good" />연결 상태 양호
          </span>
        </div>
      </header>

      <section aria-labelledby="status-title">
        <div className="mb-3 flex items-end justify-between gap-3 px-1">
          <div>
            <h2 id="status-title" className="text-lg font-extrabold sm:text-xl">한눈에 보는 상태</h2>
            <p className="mt-1 text-xs text-muted">지금 확인할 내용만 간결하게 모았어요.</p>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-good sm:hidden">
            <span className="size-2 rounded-full bg-good" />연결 양호
          </span>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
          <article className="flex min-h-[108px] items-center gap-4 rounded-2xl border border-line/90 bg-white p-4 shadow-[0_8px_24px_rgba(15,31,54,.04)] sm:block sm:p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf3ff] text-brand"><CarIcon className="size-5" /></span>
            <div className="min-w-0 sm:mt-4">
              <p className="text-[11px] font-semibold text-muted">내 차량</p>
              <p className="mt-0.5 truncate text-base font-extrabold">{driver.vehicleModel}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted">{driver.trim} · {driver.plate}</p>
            </div>
          </article>
          <article className="flex min-h-[108px] items-center gap-4 rounded-2xl border border-line/90 bg-white p-4 shadow-[0_8px_24px_rgba(15,31,54,.04)] sm:block sm:p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-good-soft text-good"><BatteryIcon className="size-5" /></span>
            <div className="min-w-0 sm:mt-4">
              <p className="text-[11px] font-semibold text-muted">연결 기기</p>
              <p className="mt-0.5 text-base font-extrabold">{devices.length}대 모두 정상</p>
              <p className="mt-0.5 text-[11px] text-muted">최저 배터리 {lowestBattery}% · {dataHealth.lastSync}</p>
            </div>
          </article>
          <article className="flex min-h-[108px] items-center gap-4 rounded-2xl border border-line/90 bg-white p-4 shadow-[0_8px_24px_rgba(15,31,54,.04)] sm:block sm:p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-caution-soft text-sm font-extrabold text-caution">D</span>
            <div className="min-w-0 sm:mt-4">
              <p className="text-[11px] font-semibold text-muted">다음 기기 점검</p>
              <p className="mt-0.5 text-base font-extrabold">D-{inspection.daysLeft}</p>
              <p className="mt-0.5 text-[11px] text-muted">{inspection.nextDate}</p>
            </div>
          </article>
        </div>
      </section>

      <DeviceOverview />

      <section className="overflow-hidden rounded-2xl border border-line/90 bg-white shadow-[0_10px_28px_rgba(15,31,54,.04)]">
        <div className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-base font-extrabold sm:text-lg">주행 데이터 상태</h2>
            <p className="mt-1 text-xs text-muted">분석에 영향을 주는 항목만 알려드려요.</p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-good-soft px-2.5 py-1 text-[11px] font-bold text-good"><span className="size-2 rounded-full bg-good" />분석 가능</span>
        </div>
        <div className="border-t border-line/80 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3 rounded-xl bg-[#fff8ed] p-3.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-caution-soft text-xs font-extrabold text-caution">!</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className="text-sm font-bold">영상 누락 구간 {dataHealth.missingSegments}개</p>
                <span className="text-[11px] font-semibold text-caution">센서 분석은 정상</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">10월 18일 페달 영상 약 14초는 센서 데이터만 사용했어요.</p>
            </div>
          </div>
          <details className="group mt-2">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-xl px-2 text-sm font-semibold marker:hidden hover:bg-canvas">
              <span>데이터 상세 보기</span>
              <ChevronIcon className="size-4 text-muted transition group-open:rotate-90" />
            </summary>
            <div className="grid grid-cols-2 gap-2 border-t border-line/80 pt-3 sm:grid-cols-4">
              <DataItem label="마지막 동기화" value={dataHealth.lastSync} />
              <DataItem label="센서 수집률" value={`${dataHealth.sensorCoveragePct}%`} />
              <DataItem label="영상 수집률" value={`${dataHealth.videoCoveragePct}%`} />
              <DataItem label="저장 데이터" value={`${dataHealth.storageUsedGb} / ${dataHealth.storageTotalGb}GB`} />
            </div>
          </details>
        </div>
      </section>

      <section className="rounded-2xl border border-line/90 bg-white p-5 shadow-[0_10px_28px_rgba(15,31,54,.04)] sm:p-6">
        <div>
          <h2 className="text-base font-extrabold sm:text-lg">현재 설정</h2>
          <p className="mt-1 text-xs text-muted">계정에 적용된 알림과 데이터 보관 상태예요.</p>
        </div>
        <div className="mt-3 divide-y divide-line/80">
          {preferences.map((item) => (
            <div key={item.label} className="flex min-h-16 items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{item.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.detail}</p>
              </div>
              <span className="inline-flex min-h-7 shrink-0 items-center justify-center rounded-full bg-[#eef4fb] px-2.5 py-1 text-center text-[11px] font-bold text-brand">{item.value}</span>
            </div>
          ))}
          <details className="group py-1">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-sm font-bold marker:hidden">
              <span>계정 및 개인정보</span>
              <ChevronIcon className="size-4 text-muted transition group-open:rotate-90" />
            </summary>
            <div className="rounded-xl bg-canvas p-3.5 text-xs leading-relaxed text-muted">
              <p>운전자 ID <b className="text-ink">{driver.id}</b></p>
              <p className="mt-1.5">실제 서비스에서는 영상 보관 기간, 분석 동의, 데이터 내려받기와 삭제를 관리할 수 있어요.</p>
            </div>
          </details>
          <Link href="/" className="flex min-h-14 items-center justify-between text-sm font-semibold text-muted transition hover:text-ink">
            <span>로그아웃</span><ChevronIcon className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function DataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-canvas p-3">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-1 text-xs font-bold tabular-nums">{value}</p>
    </div>
  );
}
