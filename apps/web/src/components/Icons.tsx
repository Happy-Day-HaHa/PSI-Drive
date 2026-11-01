import type { ReactNode, SVGProps } from "react";

function Icon({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

type P = SVGProps<SVGSVGElement>;

export const HomeIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 11.2 12 4l8 7.2V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
  </Icon>
);
export const BarsIcon = (p: P) => (
  <Icon {...p}>
    <path d="M6 20v-7M12 20V5M18 20v-10" />
  </Icon>
);
export const FlagIcon = (p: P) => (
  <Icon {...p}>
    <path d="M6 21V4M6 4.5h11l-2.5 4 2.5 4H6" />
  </Icon>
);
export const ChevronIcon = (p: P) => (
  <Icon {...p}>
    <path d="m9 6 6 6-6 6" />
  </Icon>
);
export const PlayIcon = (p: P) => (
  <Icon {...p}>
    <path d="M7 4.5v15l12-7.5z" fill="currentColor" />
  </Icon>
);
export const PauseIcon = (p: P) => (
  <Icon {...p}>
    <path d="M8 5v14M16 5v14" strokeWidth="3" />
  </Icon>
);
export const PinIcon = (p: P) => (
  <Icon {...p}>
    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="2.5" />
  </Icon>
);
export const CameraIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 7.5h3l1.5-2h7l1.5 2h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </Icon>
);
export const CarIcon = (p: P) => (
  <Icon {...p}>
    <path d="m5 10 2-4h10l2 4 1.5 2v5H3.5v-5z" />
    <path d="M6 17v2M18 17v2M6.5 13h.01M17.5 13h.01" />
  </Icon>
);
export const BatteryIcon = (p: P) => (
  <Icon {...p}>
    <rect x="3" y="7" width="17" height="10" rx="2" />
    <path d="M21 10v4M7 10v4M11 10v4M15 10v4" />
  </Icon>
);

export function PsiLogo() {
  return (
    <span className="inline-flex items-center gap-2.5 text-white">
      <span className="flex size-9 items-center justify-center rounded-[11px] bg-[linear-gradient(145deg,#3b82f6,#1b4f91)] shadow-[inset_0_1px_0_rgba(255,255,255,.22),0_5px_14px_rgba(0,0,0,.15)]">
        <svg viewBox="0 0 30 30" className="size-7" fill="none" aria-hidden>
          <path d="M4 16h5l2.3-4 3.2 11L18.2 7l2.6 11 2-3H26" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="23.8" cy="7.2" r="1.5" fill="#8de5cd" />
        </svg>
      </span>
      <span>
        <span className="block text-[15px] leading-none font-extrabold tracking-[0.04em]">PSI STUDIO</span>
        <span className="mt-1 block text-[8px] leading-none font-semibold tracking-[0.2em] text-blue-200/80">DRIVING INSIGHT</span>
      </span>
    </span>
  );
}
