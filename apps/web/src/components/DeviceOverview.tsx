import { BatteryIcon, CameraIcon, CarIcon } from "@/components/Icons";
import { devices, driver, inspection } from "@/lib/sample-data";

function batteryTone(value: number) {
  if (value >= 70) return { bar: "bg-good", text: "text-good" };
  if (value >= 40) return { bar: "bg-caution", text: "text-caution" };
  return { bar: "bg-alert", text: "text-alert" };
}

export function DeviceOverview() {
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(280px,.8fr)_minmax(0,1.5fr)]">
      <div className="rounded-2xl border border-line/90 bg-white p-5 shadow-[0_10px_28px_rgba(15,31,54,.04)] sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#edf4fc] text-brand">
            <CarIcon className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.12em] text-muted uppercase">내 차량</p>
            <h2 className="mt-1 text-lg font-bold">{driver.vehicleModel}</h2>
            <p className="mt-0.5 text-xs text-muted">{driver.trim} · {driver.plate}</p>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line/80 pt-4 text-[13px]">
          <div>
            <dt className="text-muted">차량 ID</dt>
            <dd className="mt-1 font-bold">{driver.vehicle}</dd>
          </div>
          <div>
            <dt className="text-muted">운전자 ID</dt>
            <dd className="mt-1 font-bold">{driver.id}</dd>
          </div>
        </dl>
        <div className="mt-4 rounded-xl border border-[#d9e8df] bg-[#f1f8f4] p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-good">다음 기기 점검</p>
              <p className="mt-1 text-base font-bold">{inspection.nextDate}</p>
            </div>
            <span className="rounded-full bg-good px-2.5 py-1 text-[11px] font-bold text-white">D-{inspection.daysLeft}</span>
          </div>
          <p className="mt-2 text-[11px] text-muted">점검 기간 {inspection.period}</p>
          <p className="mt-0.5 text-[11px] text-muted">마지막 점검 {inspection.lastChecked}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-line/90 bg-white p-5 shadow-[0_10px_28px_rgba(15,31,54,.04)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold tracking-[0.12em] text-brand uppercase">기기 상태</p>
            <h2 className="mt-1 text-lg font-bold">모든 장치가 정상적으로 연결됐어요</h2>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-good-soft px-2.5 py-1 text-[11px] font-bold text-good">
            <span className="size-2 rounded-full bg-good" />3대 정상
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {devices.map((device) => {
            const tone = batteryTone(device.battery);
            return (
              <article key={device.id} className="rounded-xl border border-line/90 bg-[#fbfcfe] p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-white text-brand shadow-sm">
                    {device.id.startsWith("CAM") ? <CameraIcon className="size-5" /> : <BatteryIcon className="size-5" />}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-good"><span className="size-1.5 rounded-full bg-good" />{device.status}</span>
                </div>
                <h3 className="mt-3 text-sm font-bold">{device.label}</h3>
                <p className="mt-0.5 text-[10px] text-muted">{device.id} · {device.detail}</p>
                <div className="mt-4 flex items-end justify-between">
                  <span className="text-[11px] text-muted">배터리</span>
                  <span className={`text-sm font-bold tabular-nums ${tone.text}`}>{device.battery}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-track">
                  <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${device.battery}%` }} />
                </div>
                <p className="mt-2 text-[10px] text-muted">저장공간 {device.storage}% 사용</p>
                <p className="mt-1 text-[10px] text-muted">마지막 동기화 {device.lastSync}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
