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
export const UserIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c.5-4 3.1-6 7-6s6.5 2 7 6" />
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

export function PsiLogo({ size = "default" }: { size?: "default" | "large" }) {
  return (
    <span
      role="img"
      aria-label="PSI Studio"
      className={`inline-flex items-center justify-center rounded-xl bg-white shadow-[0_3px_12px_rgba(3,15,30,.12)] ${size === "large" ? "px-3 py-2" : "px-2 py-1.5"}`}
    >
      <img
        src="/brand/psi-studio-logo.png"
        alt=""
        width="900"
        height="303"
        className={`w-auto object-contain ${size === "large" ? "h-10 sm:h-11" : "h-7"}`}
      />
    </span>
  );
}
