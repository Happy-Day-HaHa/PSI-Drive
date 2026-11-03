"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BarsIcon, FlagIcon, HomeIcon, PsiLogo, UserIcon } from "@/components/Icons";
import { dataQuality, driver, mileage } from "@/lib/sample-data";

const navItems = [
  { label: "홈", href: "/dashboard", icon: HomeIcon },
  { label: "운전 습관", href: "/pedal", icon: BarsIcon },
  { label: "주행 기록", href: "/events", icon: FlagIcon },
  { label: "마이페이지", href: "/profile", icon: UserIcon },
];

function isActive(pathname: string, href: string) {
  const path = pathname.replace(/\/$/, "") || "/";
  return path === href;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDriveReview = pathname === "/events";
  const percent = Math.round((mileage.drivenKm / mileage.goalKm) * 100);
  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-[244px] shrink-0 flex-col bg-navy px-3 py-5 text-white shadow-[8px_0_30px_rgba(9,25,46,0.08)] xl:flex">
        <Link href="/dashboard" aria-label="PSI Studio 홈" className="px-3">
          <PsiLogo />
        </Link>
        <div className="mx-3 mt-5 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-40 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-300" />
          </span>
          <span className="text-xs font-medium text-white/80">주행 기록 연결됨</span>
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
          <Link href="/" className="inline-flex text-xs font-medium text-white/55 transition hover:text-white">로그아웃</Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-navy/95 text-white shadow-[0_4px_18px_rgba(8,25,46,0.12)] backdrop-blur-md xl:hidden">
          <div className="flex min-h-16 items-center justify-between px-4">
            <Link href="/dashboard" aria-label="PSI Studio 홈">
              <PsiLogo />
            </Link>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-white/12 bg-white/[0.07] px-2.5 py-1.5 text-[10px] font-semibold text-white/75">{driver.id}</span>
              <Link href="/" className="text-[10px] font-semibold text-white/55">로그아웃</Link>
            </div>
          </div>
        </header>
        <main
          className={`mx-auto w-full max-w-[1360px] flex-1 ${
            isDriveReview
              ? "h-[calc(100dvh-4rem)] min-h-0 overflow-hidden overscroll-none px-2 pt-2 pb-[5.75rem] sm:px-4 sm:pt-3 lg:h-auto lg:overflow-visible lg:overscroll-auto lg:px-6 lg:pt-6 lg:pb-24 xl:px-8 xl:py-8"
              : "space-y-5 px-4 py-5 pb-24 sm:px-8 sm:py-8 sm:pb-24 xl:pb-8"
          }`}
        >
          {children}
        </main>
        <footer className={`mx-auto w-full max-w-[1320px] px-4 pb-28 text-xs leading-relaxed text-muted sm:px-8 lg:pb-8 ${isDriveReview ? "hidden xl:block" : ""}`}>
          점수와 지표는 운전 행동을 설명하는 자료이며, 사고 원인이나 법적 과실을 판정하지 않습니다. 현재 화면의 수치는 실제 측정값이 아닌 샘플 및 합성 데이터입니다.
        </footer>
        <nav aria-label="모바일 주 메뉴" className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 overflow-hidden rounded-2xl border border-white/10 bg-navy/95 p-1.5 text-white shadow-[0_12px_32px_rgba(5,18,34,0.28)] backdrop-blur-xl xl:hidden">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold transition-colors ${active ? "bg-white text-navy shadow-sm" : "text-white/60 active:bg-white/10"}`}
              >
                <Icon className="size-[18px]" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
