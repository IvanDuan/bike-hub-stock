"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export const APP_MAIN_SCROLL_ID = "app-main-scroll";
const PULL_THRESHOLD = 52;
const PULL_MAX = 72;

function scrollTop(): number {
  const root =
    typeof document !== "undefined"
      ? document.getElementById(APP_MAIN_SCROLL_ID)
      : null;
  if (root && root.scrollHeight > root.clientHeight + 1) {
    return root.scrollTop;
  }
  return window.scrollY || document.documentElement.scrollTop || 0;
}

export function PullToRefresh({
  children,
  onRefresh,
}: {
  children: ReactNode;
  onRefresh: () => void | Promise<void>;
}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pullRef = useRef(0);
  const active = useRef(false);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const runRefresh = useCallback(async () => {
    refreshingRef.current = true;
    setRefreshing(true);
    try {
      await onRefreshRef.current();
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
      pullRef.current = 0;
      setPull(0);
    }
  }, []);

  useEffect(() => {
    function atTop() {
      return scrollTop() <= 4;
    }

    function onTouchStart(e: TouchEvent) {
      if (!atTop() || refreshingRef.current) return;
      startY.current = e.touches[0]?.clientY ?? 0;
      active.current = true;
    }

    function onTouchMove(e: TouchEvent) {
      if (!active.current || refreshingRef.current) return;
      if (!atTop()) {
        active.current = false;
        pullRef.current = 0;
        setPull(0);
        return;
      }
      const y = e.touches[0]?.clientY ?? 0;
      const delta = y - startY.current;
      if (delta > 0) {
        const next = Math.min(delta * 0.5, PULL_MAX);
        pullRef.current = next;
        setPull(next);
      } else {
        pullRef.current = 0;
        setPull(0);
      }
    }

    function onTouchEnd() {
      if (!active.current) return;
      active.current = false;
      if (pullRef.current >= PULL_THRESHOLD && !refreshingRef.current) {
        void runRefresh();
      } else if (!refreshingRef.current) {
        pullRef.current = 0;
        setPull(0);
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [runRefresh]);

  const showIndicator = pull > 0 || refreshing;
  const ready = pull >= PULL_THRESHOLD;

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center"
        style={{
          opacity: showIndicator ? 1 : 0,
          transition: "opacity 0.15s ease",
        }}
        aria-live="polite"
      >
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-dark shadow-md ring-1 ring-zinc-200">
          {refreshing ? "Refreshing…" : ready ? "Release to refresh" : "Pull down to refresh"}
        </span>
      </div>
      <div
        style={{
          transform: showIndicator ? `translateY(${refreshing ? 8 : pull}px)` : undefined,
          transition: pull > 0 && !refreshing ? "none" : "transform 0.2s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
