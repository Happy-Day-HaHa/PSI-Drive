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
export const RecordIcon = (p: P) => (
  <Icon {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="4" />
    <circle cx="12" cy="12" r="3.2" />
  </Icon>
);
export const BarsIcon = (p: P) => (
  <Icon {...p}>
    <path d="M6 20v-7M12 20V5M18 20v-10" />
  </Icon>
);
export const GearIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" />
  </Icon>
);
export const BoltIcon = (p: P) => (
  <Icon {...p}>
    <path d="M13 3 5.5 13.5H11L10 21l8-11h-5.5z" />
  </Icon>
);
export const BrakeIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="7.5" />
    <path d="M12 8v4.5M12 15.6v.1M4 6.2A11 11 0 0 0 2.5 12M20 6.2A11 11 0 0 1 21.5 12" />
  </Icon>
);
export const OverlapIcon = (p: P) => (
  <Icon {...p}>
    <rect x="4" y="4" width="11" height="11" rx="3" />
    <rect x="9" y="9" width="11" height="11" rx="3" />
  </Icon>
);
export const ClockIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.2V12l3.2 2" />
  </Icon>
);
export const RouteIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="6" cy="18.5" r="2.2" />
    <circle cx="18" cy="5.5" r="2.2" />
    <path d="M8.2 18.5H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8" />
  </Icon>
);
export const FlagIcon = (p: P) => (
  <Icon {...p}>
    <path d="M6 21V4M6 4.5h11l-2.5 4 2.5 4H6" />
  </Icon>
);
export const BulbIcon = (p: P) => (
  <Icon {...p}>
    <path d="M9.2 17.5h5.6M10 21h4M12 3a6.5 6.5 0 0 0-3.9 11.7c.7.6 1.1 1.3 1.1 2.3v.5h5.6V17c0-1 .4-1.7 1.1-2.3A6.5 6.5 0 0 0 12 3z" />
  </Icon>
);
export const CalendarIcon = (p: P) => (
  <Icon {...p}>
    <rect x="4" y="5.5" width="16" height="14.5" rx="3" />
    <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
  </Icon>
);
export const ShieldIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 3 5 5.6v5.6c0 4.4 2.9 8 7 9.8 4.1-1.8 7-5.4 7-9.8V5.6z" />
    <path d="m8.8 12 2.3 2.3 4.2-4.4" />
  </Icon>
);
export const CarIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 16.5v-3.2c0-.6.2-1.2.6-1.7L7 8.2C7.5 7.4 8.4 7 9.3 7h5.4c.9 0 1.8.4 2.3 1.2l2.4 3.4c.4.5.6 1.1.6 1.7v3.2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
    <path d="M5 11.5h14M7.5 14.5h1.5M15 14.5h1.5M6.5 17.5V19M17.5 17.5V19" />
  </Icon>
);
export const ChevronIcon = (p: P) => (
  <Icon {...p}>
    <path d="m9 6 6 6-6 6" />
  </Icon>
);

export function PsiLogo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg viewBox="0 0 44 28" className="h-7 w-11" fill="none" aria-hidden>
        <path
          d="M2 16h8l3.5-5 4.5 15L24 2l4.5 19 3-5H42"
          stroke="var(--color-brand)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[22px] font-extrabold tracking-tight text-navy italic">PSI</span>
    </span>
  );
}
