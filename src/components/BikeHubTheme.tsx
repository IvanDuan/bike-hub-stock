import type { ReactNode } from "react";

/** Subtle wheel pattern — shared civic / AT bike-hub page feel, in brand blue. */
export function BikeHubHeroPattern({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full text-white ${className}`}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="bh-wheel" width="56" height="56" patternUnits="userSpaceOnUse">
          <circle cx="28" cy="28" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
          <circle cx="28" cy="28" r="4" fill="currentColor" opacity="0.25" />
          {[0, 45, 90, 135].map((deg) => (
            <line
              key={deg}
              x1="28"
              y1="28"
              x2="28"
              y2="10"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.2"
              transform={`rotate(${deg} 28 28)`}
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#bh-wheel)" />
    </svg>
  );
}

export function BikeHubWaveDivider() {
  return (
    <svg
      className="relative -mb-px block w-full text-background"
      viewBox="0 0 1440 56"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M0,28 C240,56 480,8 720,32 C960,56 1200,12 1440,36 L1440,56 L0,56 Z"
      />
    </svg>
  );
}

const SERVICES = [
  {
    label: "Community repair",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
      />
    ),
  },
  {
    label: "Refurbished bikes",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M5 18a3 3 0 100-6 3 3 0 000 6zm14 0a3 3 0 100-6 3 3 0 000 6zM8 18h8M9 12l2-4h4l2 4"
      />
    ),
  },
  {
    label: "Learn & fix",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    ),
  },
  {
    label: "Donate bikes",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    ),
  },
] as const;

export function BikeHubServiceStrip({ compact = false }: { compact?: boolean }) {
  return (
    <ul
      className={`flex flex-wrap justify-center gap-2 ${compact ? "mt-3" : "mt-4"}`}
      aria-label="Bike hub services"
    >
      {SERVICES.map((s) => (
        <li
          key={s.label}
          className={`inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-white ring-1 ring-white/25 backdrop-blur-sm ${
            compact ? "text-[10px] font-semibold" : "text-xs font-semibold"
          }`}
        >
          <svg
            className={compact ? "h-3.5 w-3.5 shrink-0" : "h-4 w-4 shrink-0"}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            {s.icon}
          </svg>
          {s.label}
        </li>
      ))}
    </ul>
  );
}

export function BikeHubNetworkBadge() {
  return (
    <p className="mt-3 text-center text-[11px] font-medium leading-snug text-white/75">
      Auckland community bike hubs · supportive, inclusive neighbourhood spaces
    </p>
  );
}

export function BikeHubCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-md shadow-brand/5 ring-1 ring-zinc-100 ${className}`}
    >
      <div className="h-1 bg-gradient-to-r from-brand via-brand-dark to-brand-green" />
      <div className="p-6">{children}</div>
    </div>
  );
}

export function BikeHubPageHero({
  children,
  tall = false,
}: {
  children: ReactNode;
  tall?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-brand via-brand to-brand-dark ${
        tall ? "pb-0 pt-10" : "pb-0 pt-8"
      }`}
    >
      <BikeHubHeroPattern className="opacity-[0.12]" />
      <div className="relative z-10 px-4">{children}</div>
      <BikeHubWaveDivider />
    </div>
  );
}
