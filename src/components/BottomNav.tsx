"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavHomeIcon, NavPromoteIcon, NavStatsIcon } from "@/components/NavIcons";
import { useAuth } from "@/components/AuthProvider";

const links = [
  {
    href: "/",
    label: "Home",
    Icon: NavHomeIcon,
    match: (path: string) => path === "/" || path.startsWith("/bikes"),
  },
  {
    href: "/stats",
    label: "Stats",
    Icon: NavStatsIcon,
    match: (path: string) => path.startsWith("/stats"),
    requiresManager: true,
  },
  {
    href: "/promote",
    label: "Promote",
    Icon: NavPromoteIcon,
    match: (path: string) => path.startsWith("/promote"),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { session } = useAuth();
  const isPrivileged =
    session?.role === "superadmin" || session?.role === "branch_manager" || session?.role === "manager";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg items-stretch">
        {links
          .filter((l) => !(l as { requiresManager?: boolean }).requiresManager || isPrivileged)
          .map((link) => {
          const active = link.match(pathname);
          const { Icon } = link;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-semibold transition-colors ${
                active ? "text-brand" : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                  active ? "bg-brand-light text-brand" : "text-current"
                }`}
              >
                <Icon className="h-6 w-6" />
              </span>
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
