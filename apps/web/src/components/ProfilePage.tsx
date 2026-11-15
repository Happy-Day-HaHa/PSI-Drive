import Link from "next/link";
import { ChevronIcon, UserIcon } from "@/components/Icons";
import { EvidenceDisclosure, SampleBadge } from "@/components/ui";
import { pedalSamples } from "@/lib/pedal";

export function ProfilePage() {
  const { source, configVersion, provenance, scope } = pedalSamples;
  return (
    <div className="space-y-4 sm:space-y-5">
      <header className="rounded-[24px] border border-line/90 bg-white px-5 py-5 shadow-[0_12px_34px_rgba(15,31,54,.05)] sm:px-7 sm:py-6">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf3ff] text-brand sm:size-14"><UserIcon className="size-6 sm:size-7" /></span>
          <div>
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-extrabold tracking-[-.02em] sm:text-2xl">마이페이지</h1><SampleBadge /></div>
            <p className="mt-1 text-xs text-muted sm:text-sm">실제 계정·차량·기기는 아직 연결되지 않았습니다.</p>
          </div>
        </div>
      </header>

      <EvidenceDisclosure source={source} configVersion={configVersion} sessions={scope.sessions} events={scope.hazardEvents} seeds={provenance.sessionSeeds} sampleIntervalMs={provenance.sampleIntervalMs} formula={provenance.scoreFormula} limitation={provenance.limitation} />

      <section aria-labelledby="status-title">
        <div className="mb-3 px-1"><h2 id="status-title" className="text-lg font-extrabold sm:text-xl">한눈에 보는 상태</h2><p className="mt-1 text-xs text-muted">연결 근거가 없는 배터리·수집률·점검일 수치는 표시하지 않습니다.</p></div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["계정", "데모 모드", "인증 서버 미연결"],
            ["차량·기기", "미연동", "실기기 상태값 없음"],
            ["점검 일정", "미설정", "장비 연결 후 계산"],
          ].map(([label, value, note]) => (
            <article key={label} className="rounded-2xl border border-line/90 bg-white p-5 shadow-[0_8px_24px_rgba(15,31,54,.04)]">
              <p className="text-[11px] font-semibold text-muted">{label}</p><p className="mt-2 text-base font-extrabold">{value}</p><p className="mt-1 text-[11px] text-muted">{note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-line/90 bg-white shadow-[0_10px_28px_rgba(15,31,54,.04)]">
        <div className="px-5 py-4 sm:px-6 sm:py-5"><h2 className="text-base font-extrabold sm:text-lg">분석 데이터 상태</h2><p className="mt-1 text-xs text-muted">현재 확인 가능한 범위는 생성기로 검증된 합성 데이터뿐입니다.</p></div>
        <details className="group border-t border-line/80 px-5 py-2 sm:px-6">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-sm font-semibold marker:hidden"><span>데이터 상세 보기</span><ChevronIcon className="size-4 text-muted transition group-open:rotate-90" /></summary>
          <dl className="grid gap-2 border-t border-line/80 py-3 sm:grid-cols-3">
            <DataItem label="데이터 종류" value="합성 정답값" />
            <DataItem label="생성 명령" value={provenance.generatedBy} />
            <DataItem label="설정 버전" value={configVersion} />
          </dl>
        </details>
      </section>

      <section className="rounded-2xl border border-line/90 bg-white p-5 shadow-[0_10px_28px_rgba(15,31,54,.04)] sm:p-6">
        <h2 className="text-base font-extrabold sm:text-lg">현재 설정</h2>
        <p className="mt-1 text-xs text-muted">알림과 보관 정책은 백엔드 연결 후 실제 값을 표시합니다.</p>
        <div className="mt-3 divide-y divide-line/80">
          {["주간 운전 리포트", "주행 알림", "데이터 보관 정책"].map((label) => <div key={label} className="flex min-h-14 items-center justify-between gap-3 py-3"><p className="text-sm font-bold">{label}</p><span className="rounded-full bg-canvas px-2.5 py-1 text-[11px] font-bold text-muted">설정 전</span></div>)}
          <Link href="/" className="flex min-h-14 items-center justify-between text-sm font-semibold text-muted transition hover:text-ink"><span>로그아웃</span><ChevronIcon className="size-4" /></Link>
        </div>
      </section>
    </div>
  );
}

function DataItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-canvas p-3"><dt className="text-[11px] text-muted">{label}</dt><dd className="mt-1 break-all text-xs font-bold">{value}</dd></div>;
}
