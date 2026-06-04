"use client";

import { useEffect, useRef } from "react";

/** Refetch when the PWA/tab becomes visible again (e.g. after Add to Home Screen resume). */
export function useRefetchOnVisible(refetch: () => void | Promise<void>) {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    const run = () => {
      void refetchRef.current();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };

    window.addEventListener("pageshow", run);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("pageshow", run);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
