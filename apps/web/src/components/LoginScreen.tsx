"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { BatteryIcon, CameraIcon, PsiLogo } from "@/components/Icons";

export function LoginScreen() {
  const router = useRouter();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push("/dashboard");
  };

  return (
    <main className="min-h-dvh bg-[#edf2f8] p-3 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100dvh-24px)] max-w-[1180px] overflow-hidden rounded-[24px] bg-white shadow-[0_24px_70px_rgba(10,29,52,.16)] sm:min-h-[calc(100dvh-48px)] lg:grid-cols-[1.08fr_.92fr]">
        <section className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#081b33_0%,#123c70_62%,#226ab0_100%)] p-10 text-white lg:flex lg:flex-col">
          <div aria-hidden className="absolute -top-24 -right-24 size-96 rounded-full border border-white/10 bg-white/[.035]" />
          <div aria-hidden className="absolute -bottom-32 -left-24 size-96 rounded-full border border-white/10" />
          <PsiLogo />
          <div className="relative my-auto max-w-lg">
            <p className="text-xs font-bold tracking-[.18em] text-blue-200 uppercase">오늘의 운전을 더 편안하게</p>
            <h1 className="mt-4 text-[42px] leading-[1.2] font-bold tracking-[-.035em]">
              나의 운전 습관을<br />한눈에 돌아보세요.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-white/68">
              점수 변화부터 발과 페달의 움직임, 차량과 블랙박스 상태까지 필요한 정보만 편하게 확인할 수 있어요.
            </p>
            <div className="mt-9 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/12 bg-white/[.08] p-4 backdrop-blur-sm">
                <CameraIcon className="size-6 text-blue-200" />
                <p className="mt-3 text-sm font-bold">블랙박스 연결 양호</p>
                <p className="mt-1 text-xs text-white/55">전방·페달 카메라 실시간 확인</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/[.08] p-4 backdrop-blur-sm">
                <BatteryIcon className="size-6 text-emerald-200" />
                <p className="mt-3 text-sm font-bold">평균 배터리 83%</p>
                <p className="mt-1 text-xs text-white/55">다음 점검까지 19일</p>
              </div>
            </div>
          </div>
          <p className="relative text-[11px] text-white/40">PSI Studio · Driving insight made simple</p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-[390px]">
            <div className="mb-10 flex justify-center rounded-2xl bg-navy px-5 py-4 lg:hidden">
              <PsiLogo />
            </div>
            <span className="inline-flex rounded-full bg-[#eef5fc] px-2.5 py-1 text-[11px] font-bold text-brand">PSI Studio 데모</span>
            <h2 className="mt-4 text-[30px] font-bold tracking-[-.035em]">다시 만나서 반가워요</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">계정으로 로그인하고 오늘의 운전 상태를 확인해 보세요.</p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-ink">이메일</span>
                <input
                  type="email"
                  required
                  defaultValue="driver@psi.studio"
                  autoComplete="email"
                  className="mt-2 h-12 w-full rounded-xl border border-line bg-[#fbfcfe] px-4 text-sm outline-none transition focus:border-brand focus:ring-3 focus:ring-brand/10"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-ink">비밀번호</span>
                <input
                  type="password"
                  required
                  defaultValue="psi-demo"
                  autoComplete="current-password"
                  className="mt-2 h-12 w-full rounded-xl border border-line bg-[#fbfcfe] px-4 text-sm outline-none transition focus:border-brand focus:ring-3 focus:ring-brand/10"
                />
              </label>
              <div className="flex items-center justify-between gap-3 text-xs">
                <label className="flex items-center gap-2 text-muted"><input type="checkbox" defaultChecked className="accent-brand" />로그인 유지</label>
                <span className="font-medium text-brand">데모 계정이 입력되어 있어요</span>
              </div>
              <button type="submit" className="mt-2 h-12 w-full rounded-xl bg-brand text-sm font-bold text-white shadow-[0_8px_20px_rgba(23,63,115,.18)] transition hover:bg-brand-hover active:scale-[.99]">
                로그인
              </button>
            </form>
            <div className="mt-7 rounded-xl border border-line/80 bg-[#f8fafc] p-3 text-center text-[11px] leading-relaxed text-muted">
              현재 화면은 샘플 데이터로 구성된 데모입니다.<br />실제 계정 연동 시 개인정보와 차량 데이터가 안전하게 분리됩니다.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
