"use client";

import { useMemo, useState } from "react";

function normalizeTag(raw: string): string {
  const t = raw.trim().replace(/^#/, "");
  return t.replace(/\s+/g, " ").trim();
}

export function TagInput({
  label,
  value,
  onChange,
  suggestions,
  placeholder = "Add tags like #new tires, #lightweight",
}: {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
  placeholder?: string;
}) {
  const [text, setText] = useState("");

  const normalizedValue = useMemo(() => {
    const map = new Map<string, string>();
    value.forEach((t) => {
      const n = normalizeTag(t);
      if (!n) return;
      if (!map.has(n.toLowerCase())) map.set(n.toLowerCase(), n);
    });
    return Array.from(map.values());
  }, [value]);

  const suggestionList = useMemo(() => {
    const q = normalizeTag(text).toLowerCase();
    const existing = new Set(normalizedValue.map((t) => t.toLowerCase()));
    return suggestions
      .map(normalizeTag)
      .filter(Boolean)
      .filter((t) => !existing.has(t.toLowerCase()))
      .filter((t) => (q ? t.toLowerCase().includes(q) : true))
      .slice(0, 12);
  }, [suggestions, text, normalizedValue]);

  function addTag(raw: string) {
    const n = normalizeTag(raw);
    if (!n) return;
    const existing = new Set(normalizedValue.map((t) => t.toLowerCase()));
    if (existing.has(n.toLowerCase())) return;
    onChange([...normalizedValue, n]);
    setText("");
  }

  function removeTag(tag: string) {
    const lower = tag.toLowerCase();
    onChange(normalizedValue.filter((t) => t.toLowerCase() !== lower));
  }

  return (
    <section className="space-y-2 rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
      <h2 className="text-sm font-semibold text-zinc-700">{label}</h2>

      {normalizedValue.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {normalizedValue.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => removeTag(t)}
              className="inline-flex items-center gap-2 rounded-full bg-brand-light px-3 py-1 text-sm font-semibold text-brand-dark"
              title="Tap to remove"
            >
              <span>#{t}</span>
              <span className="text-brand/70">×</span>
            </button>
          ))}
        </div>
      )}

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
            e.preventDefault();
            addTag(text);
          }
          if (e.key === "Backspace" && !text && normalizedValue.length > 0) {
            e.preventDefault();
            onChange(normalizedValue.slice(0, -1));
          }
        }}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-base outline-none focus:border-brand"
        autoCapitalize="sentences"
      />

      {suggestionList.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {suggestionList.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => addTag(t)}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm font-medium text-zinc-700 hover:border-brand"
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-zinc-500">
        Add a few selling points customers care about (tap suggestions or type your own).
      </p>
    </section>
  );
}

