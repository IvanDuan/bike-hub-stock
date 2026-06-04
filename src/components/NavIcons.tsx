import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": true,
} as const;

const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Stock / home — bicycle */
export function NavHomeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="7" cy="16.5" r="2.75" {...stroke} />
      <circle cx="17" cy="16.5" r="2.75" {...stroke} />
      <path
        d="M7 16.5 10.5 9h2.5l1.2 2.8h2.8L17 16.5M10.5 9h4.2M13 9l1.8-3.5h2.7"
        {...stroke}
      />
    </svg>
  );
}

/** Statistics — bar chart */
export function NavStatsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 19V12M10 19V8M15 19V14M20 19V6" {...stroke} />
      <path d="M4 19h17" {...stroke} />
    </svg>
  );
}

/** Promote — megaphone */
export function NavPromoteIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 9.5v5l8.5 3.8V5.7L5 9.5Z" {...stroke} />
      <path
        d="M5 14.5H3.75a1.25 1.25 0 0 1-1.25-1.25v-2.5c0-.69.56-1.25 1.25-1.25H5"
        {...stroke}
      />
      <path d="M16.5 9c1 0.9 1.6 2 1.6 3s-.6 2.1-1.6 3" {...stroke} />
      <path d="M18.5 7c1.6 1.4 2.5 3.1 2.5 5s-.9 3.6-2.5 5" {...stroke} opacity={0.45} />
    </svg>
  );
}
