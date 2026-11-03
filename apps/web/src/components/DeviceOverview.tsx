import { BatteryIcon, CameraIcon } from "@/components/Icons";
import { devices } from "@/lib/sample-data";

function batteryTone(value: number) {
  if (value >= 70) return { bar: "bg-good", text: "text-good" };
  if (value >= 40) return { bar: "bg-caution", text: "text-caution" };
  return { bar: "bg-alert", text: "text-alert" };
}

export function DeviceOverview() {
  return (
    <section aria-labelledby="device-title" className="rounded-2xl border border-line/90 bg-white p-5 shadow-[0_10px_28px_rgba(15,31,54,.04)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="device-title" className="text-base font-extrabold sm:text-lg">연결 기기</h2>
          <p className="mt-1 text-xs text-muted">배터리와 연결 상태를 빠르게 확인하세요.</p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-good-soft px-2.5 py-1 text-[11px] font-bold text-good">
          <span className="size-2 rounded-full bg-good" />{devices.length}대 정상
        </span>
      </div>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
        {devices.map((device) => {
          const tone = batteryTone(device.battery);
          return (
            <article key={device.id} className="rounded-xl border border-line/90 bg-[#fbfcfe] p-3.5 sm:p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand shadow-sm">
                  {device.id.startsWith("CAM") ? <CameraIcon className="size-5" /> : <BatteryIcon className="size-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-sm font-bold">{device.label}</h3>
                    <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-good"><span className="size-1.5 rounded-full bg-good" />{device.status}</span>
                  </div>
                  <p className="mt-0.5 truncate text-[10px] text-muted">{device.detail}</p>
                </div>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <span className="text-[11px] text-muted">배터리</span>
                <span className={`text-sm font-extrabold tabular-nums ${tone.text}`}>{device.battery}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-track">
                <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${device.battery}%` }} />
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-2 text-[10px] text-muted">
                <span>저장공간 {device.storage}%</span>
                <span className="truncate">동기화 {device.lastSync}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
