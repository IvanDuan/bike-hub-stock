"use client";

import { useState } from "react";

export function ShareBrowseLink() {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = `${window.location.origin}/browse`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copyLink}
      className="rounded-lg px-2.5 py-1 text-xs font-semibold text-brand-yellow hover:bg-white/10"
      title="Copy customer browse link"
    >
      {copied ? "Link copied!" : "Share shop link"}
    </button>
  );
}
