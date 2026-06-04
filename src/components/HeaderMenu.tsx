"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ShareBrowseLink } from "@/components/ShareBrowseLink";
import { useAuth } from "@/components/AuthProvider";

function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M5 7h14M5 12h14M5 17h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HeaderMenu({
  onSignOut,
}: {
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [render, setRender] = useState(false);
  const [shown, setShown] = useState(false);
  const { session } = useAuth();
  const isAdmin =
    session?.role === "superadmin" || session?.role === "branch_manager" || session?.role === "manager";

  useEffect(() => {
    if (open) {
      setRender(true);
      // allow the portal to mount before animating
      requestAnimationFrame(() => setShown(true));
      return;
    }
    setShown(false);
    const t = window.setTimeout(() => setRender(false), 200);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/10"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2">
          <MenuIcon />
          Menu
        </span>
      </button>

      {render &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[90]"
            role="presentation"
            onClick={() => setOpen(false)}
          >
            <div className="absolute inset-0 bg-black/40" aria-hidden />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className={`absolute right-0 top-0 h-full w-[min(17rem,78vw)] bg-white shadow-2xl transition-transform duration-200 ease-out ${
                shown ? "translate-x-0" : "translate-x-full"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-4">
                <p className="text-sm font-semibold text-zinc-900">Menu</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-1 text-sm font-semibold text-zinc-600 hover:bg-zinc-100"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3 p-4">
                <ShareBrowseLink
                  variant="menu"
                  className="ring-1 ring-brand-light"
                />

                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  Account
                  <span className="text-zinc-400">→</span>
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                  >
                    Admin
                    <span className="text-zinc-400">→</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onSignOut();
                  }}
                  className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

