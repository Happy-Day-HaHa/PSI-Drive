import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "PSI Studio",
  description: "페달 조작을 밀리초 단위로 분석하는 운전 습관 분석 서비스",
};

export const viewport: Viewport = {
  themeColor: "#10264a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
