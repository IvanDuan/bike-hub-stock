"use client";

import { useState } from "react";

export function ShareBrowseLink({
  variant = "inline",
  className = "",
}: {
  variant?: "inline" | "menu";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  async function copyLink() {
    // Build URL safely even if origin has a trailing slash
    const url = new URL("/browse", window.location.origin).toString();
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    } catch {
      // Clipboard can be blocked on iOS / non-HTTPS origins
      try {
        // iOS-friendly fallback: user can long-press and copy.
        window.prompt("Copy this link:", url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch {
        setCopyError(
          "Couldn’t copy automatically on this device. Open /browse in Safari and copy from the address bar."
        );
      }
    }
  }

  const label = copied ? "Copied!" : "Copy Sharable Link";

  return (
    <div className={variant === "menu" ? "space-y-2" : ""}>
      <button
        type="button"
        onClick={copyLink}
        className={
          variant === "menu"
            ? `flex w-full items-center justify-between rounded-xl bg-brand-light px-4 py-3 text-sm font-semibold text-brand-dark hover:bg-brand-light/80 ${className}`
            : `rounded-lg px-2.5 py-1 text-xs font-semibold text-brand-yellow hover:bg-white/10 ${className}`
        }
        title="Copy customer browse link"
      >
        <span>{label}</span>
        {variant === "menu" && <span className="text-brand/70">⧉</span>}
      </button>
      {copyError && variant === "menu" && (
        <p className="text-xs text-zinc-500">{copyError}</p>
      )}
    </div>
  );
}
