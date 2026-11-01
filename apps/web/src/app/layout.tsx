import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { RouteShell } from "@/components/RouteShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "PSI Studio",
  description: "시간에 따른 페달 조작과 운전 습관을 편하게 돌아보는 서비스",
};

export const viewport: Viewport = {
  themeColor: "#12233f",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <RouteShell>{children}</RouteShell>
      </body>
    </html>
  );
}
