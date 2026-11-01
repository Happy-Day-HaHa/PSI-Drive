"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BarsIcon, FlagIcon, HomeIcon, PsiLogo } from "@/components/Icons";
import { dataQuality, driver, mileage } from "@/lib/sample-data";

const navItems = [
  { label: "대시보드", href: "/", icon: HomeIcon },
  { label: "페달 습관", href: "/pedal", icon: BarsIcon },
  { label: "사건 분석", href: "/events", icon: FlagIcon },
];

function isActive(pathname: string, href: string) {
  const path = pathname.replace(/\/$/, "") || "/";
  return path === href;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const percent = Math.round((mileage.drivenKm / mileage.goalKm) * 100);
  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-[244px] shrink-0 flex-col bg-navy px-3 py-5 text-white shadow-[8px_0_30px_rgba(9,25,46,0.08)] lg:flex">
        <Link href="/" aria-label="PSI 스튜디오 홈" className="px-3">
          <PsiLogo />
        </Link>
        <div className="mx-3 mt-5 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-40 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-300" />
          </span>
          <span className="text-xs font-medium text-white/80">분석 시스템 정상</span>
          <span className="ml-auto text-[10px] text-white/45">LIVE</span>
        </div>
        <nav aria-label="주 메뉴" className="mt-8 space-y-1">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/6 hover:text-white"
                }`}
              >
                <Icon className="size-[18px]" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-4 border-t border-white/12 px-3 pt-4 text-[13px]">
          <div>
            <p className="text-white/60">운전자 · 차량</p>
            <p className="mt-0.5 font-medium">
              {driver.id} · {driver.vehicle}
            </p>
          </div>
          <div>
            <div className="flex justify-between text-white/60">
              <span>이번 달 주행거리</span>
              <span>{percent}%</span>
            </div>
            <div
              className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/15"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="월간 주행거리 진행률"
            >
              <div className="h-full rounded-full bg-white" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-1.5 font-medium">
              {mileage.drivenKm.toLocaleString("ko-KR")} / {mileage.goalKm.toLocaleString("ko-KR")}km
            </p>
          </div>
          <div>
            <p className="text-white/60">데이터 품질</p>
            <p className="mt-0.5 font-medium">
              동기화 {dataQuality.sync} · 결측률 {dataQuality.missingRatePct}%
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 bg-navy text-white lg:hidden">
          <div className="flex items-center justify-between px-4 pt-3">
            <Link href="/" aria-label="PSI 스튜디오 홈">
              <PsiLogo />
            </Link>
            <span className="text-xs text-white/70">
              {driver.id} · {driver.vehicle}
            </span>
          </div>
          <nav aria-label="주 메뉴" className="mt-2 flex gap-1 px-2">
            {navItems.map(({ label, href }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`border-b-2 px-3 py-2 text-sm font-medium ${active ? "border-white text-white" : "border-transparent text-white/70"}`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-[1360px] flex-1 space-y-5 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
        <footer className="mx-auto w-full max-w-[1320px] px-4 pb-8 text-xs leading-relaxed text-muted sm:px-8">
          점수와 지표는 운전 행동을 설명하는 자료이며, 사고 원인이나 법적 과실을 판정하지 않습니다. 현재 화면의 수치는 실제 측정값이 아닌 샘플 및 합성 데이터입니다.
        </footer>
      </div>
    </div>
  );
}
