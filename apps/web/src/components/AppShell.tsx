"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BarsIcon, FlagIcon, HomeIcon, PsiLogo, UserIcon } from "@/components/Icons";

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
  const normalizedPath = pathname.replace(/\/$/, "") || "/";
  const isDriveReview = normalizedPath === "/events";
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
            <span className="ml-auto text-[10px] font-semibold text-white/65">LIVE</span>
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
        <div className="mt-auto space-y-2 border-t border-white/12 px-2 pt-4">
          <Link href="/profile" className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-white/70 transition hover:bg-white/6 hover:text-white">
            <span className="flex size-8 items-center justify-center rounded-lg bg-white/8"><UserIcon className="size-4" /></span>
            <span><b className="block text-xs">마이페이지</b><span className="mt-0.5 block text-[11px] text-white/60">차량과 기기 상태 확인</span></span>
          </Link>
          <Link href="/" className="inline-flex min-h-11 items-center px-2 text-xs font-semibold text-white/65 transition hover:text-white">로그아웃</Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-navy/95 text-white shadow-[0_4px_18px_rgba(8,25,46,0.12)] backdrop-blur-md xl:hidden">
          <div className="flex min-h-16 items-center justify-between px-4">
            <Link href="/dashboard" aria-label="PSI Studio 홈">
              <PsiLogo />
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/" className="inline-flex min-h-11 items-center px-2 text-xs font-semibold text-white/70">로그아웃</Link>
            </div>
          </div>
        </header>
        <main
          className={`mx-auto w-full max-w-[1360px] flex-1 ${
            isDriveReview
              ? "h-[calc(100dvh-4rem)] min-h-0 overflow-hidden overscroll-none px-2 pt-2 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:px-4 sm:pt-3 lg:h-auto lg:overflow-visible lg:overscroll-auto lg:px-6 lg:pt-6 lg:pb-24 xl:px-8 xl:py-8"
              : "space-y-5 px-4 py-5 pb-24 sm:px-8 sm:py-8 sm:pb-24 xl:pb-8"
          }`}
        >
          {children}
        </main>
        <footer className={`mx-auto w-full max-w-[1320px] px-4 pb-28 text-xs leading-relaxed text-muted sm:px-8 lg:pb-8 ${isDriveReview ? "hidden xl:block" : ""}`}>
          점수와 지표는 운전 행동을 설명하는 자료이며, 사고 원인이나 법적 과실을 판정하지 않습니다. 현재 화면의 수치는 실제 측정값이 아닌 샘플 및 합성 데이터입니다.
        </footer>
        <nav aria-label="모바일 주 메뉴" className="fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-40 grid grid-cols-4 overflow-hidden rounded-2xl border border-white/10 bg-navy/95 p-1.5 text-white shadow-[0_12px_32px_rgba(5,18,34,0.28)] backdrop-blur-xl xl:hidden">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-center text-[11px] font-semibold transition-colors ${active ? "bg-white text-navy shadow-sm" : "text-white/70 active:bg-white/10"}`}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
