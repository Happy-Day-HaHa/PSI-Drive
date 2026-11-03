"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PsiLogo } from "@/components/Icons";

export function LoginScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push("/dashboard");
  };

  return (
    <main className="min-h-dvh bg-navy lg:bg-[#e8eef6] lg:p-6">
      <div className="mx-auto grid min-h-dvh max-w-[1180px] overflow-hidden bg-white shadow-[0_28px_80px_rgba(10,29,52,.18)] lg:min-h-[calc(100dvh-48px)] lg:grid-cols-[1.08fr_.92fr] lg:rounded-[28px]">
        <section className="relative overflow-hidden bg-[linear-gradient(145deg,#071a31_0%,#103763_58%,#1f66ae_100%)] px-5 pt-5 pb-14 text-white sm:px-8 sm:pt-7 lg:flex lg:min-h-full lg:flex-col lg:p-10">
          <div aria-hidden className="absolute -top-32 -right-20 size-[360px] rounded-full border border-white/[.08]" />
          <div aria-hidden className="absolute top-[42%] -left-40 size-[420px] rounded-full border border-blue-200/[.08]" />
          <div className="relative flex items-center justify-between gap-4">
            <PsiLogo size="large" />
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.07] px-2.5 py-1.5 text-[10px] font-semibold text-white/70 backdrop-blur">
              <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_0_3px_rgba(110,231,183,.12)]" />보안 연결
            </span>
          </div>

          <div className="relative mt-10 pb-5 lg:my-auto lg:max-w-lg lg:pb-0">
            <p className="text-[10px] font-bold tracking-[.2em] text-blue-200 uppercase sm:text-xs">Driving behavior intelligence</p>
            <h1 className="mt-3 text-[29px] leading-[1.22] font-extrabold tracking-[-.035em] sm:text-4xl lg:mt-4 lg:text-[44px]">
              나의 운전을 이해하는<br />가장 선명한 방법.
            </h1>
            <p className="mt-3 max-w-md text-[13px] leading-6 text-white/65 sm:text-sm lg:mt-5 lg:text-[15px] lg:leading-7">
              주행 기록과 페달 움직임을 연결해<br className="sm:hidden" /> 더 편안한 운전 습관을 발견하세요.
            </p>
            <div className="mt-7 hidden items-center gap-3 text-[11px] font-semibold text-white/50 lg:flex">
              <span>주행 기록</span><span className="size-1 rounded-full bg-blue-300/70" /><span>페달 동기화</span><span className="size-1 rounded-full bg-blue-300/70" /><span>운전 습관</span>
            </div>
          </div>
          <p className="relative hidden text-[10px] tracking-[.08em] text-white/35 lg:block">PSI STUDIO · DRIVER EXPERIENCE PLATFORM</p>
        </section>

        <section className="relative -mt-7 flex rounded-t-[28px] bg-white px-5 pt-7 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-10 lg:mt-0 lg:items-center lg:justify-center lg:rounded-none lg:p-14">
          <div className="mx-auto w-full max-w-[390px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold tracking-[.12em] text-brand">ACCOUNT SIGN IN</p>
                <h2 className="mt-2 text-[26px] font-extrabold tracking-[-.035em] sm:text-[30px]">내 운전 데이터 확인하기</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">등록된 계정으로 안전하게 로그인하세요.</p>
              </div>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-ink">이메일</span>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="mt-2 h-12 w-full rounded-xl border border-[#d8e0ea] bg-white px-4 text-sm outline-none transition placeholder:text-[#a4adba] focus:border-brand focus:ring-4 focus:ring-brand/10"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-ink">비밀번호</span>
                <span className="relative mt-2 block">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="비밀번호 입력"
                    autoComplete="current-password"
                    className="h-12 w-full rounded-xl border border-[#d8e0ea] bg-white px-4 pr-16 text-sm outline-none transition placeholder:text-[#a4adba] focus:border-brand focus:ring-4 focus:ring-brand/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 min-w-14 px-3 text-[11px] font-bold text-muted transition hover:text-ink"
                    aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {showPassword ? "숨기기" : "보기"}
                  </button>
                </span>
              </label>
              <div className="flex items-center justify-between gap-3 text-xs">
                <label className="flex min-h-8 cursor-pointer items-center gap-2 text-muted">
                  <input type="checkbox" defaultChecked className="size-4 rounded accent-brand" />로그인 유지
                </label>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-good"><span className="size-1.5 rounded-full bg-good" />암호화 연결</span>
              </div>
              <button type="submit" className="h-12 w-full rounded-xl bg-brand text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(36,108,226,.22)] transition hover:bg-brand-hover active:translate-y-px">
                로그인
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-[10px] font-semibold text-[#98a2b1] before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">또는</div>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="group flex min-h-14 w-full items-center justify-between rounded-xl border border-line bg-[#f8fafc] px-4 text-left transition hover:border-[#bfd4f6] hover:bg-[#f3f7fd] active:translate-y-px"
            >
              <span>
                <b className="block text-sm">데모 화면 둘러보기</b>
                <span className="mt-0.5 block text-[10px] text-muted">로그인 없이 샘플 운전 데이터를 확인해요.</span>
              </span>
              <span className="text-lg text-brand transition-transform group-hover:translate-x-0.5" aria-hidden>→</span>
            </button>

            <p className="mt-5 text-center text-[10px] leading-relaxed text-muted">
              데모 데이터는 실제 계정 및 차량 정보와 연결되지 않습니다.<br className="hidden sm:block" /> 로그인 시 개인정보 처리방침과 서비스 이용약관에 동의하게 됩니다.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
