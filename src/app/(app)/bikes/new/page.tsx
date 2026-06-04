"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { compressPhoto } from "@/lib/compress-photo";
import { storageErrorMessage } from "@/lib/safe-storage";
import { useAuth } from "@/components/AuthProvider";
import { TagInput } from "@/components/TagInput";
import { createBike, listTags } from "@/lib/bikes-api";
import { BIKE_TYPES, type BikeType } from "@/lib/constants";

export default function NewBikePage() {
  const router = useRouter();
  const { session } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sellingTags, setSellingTags] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiFields, setAiFields] = useState<{
    make?: string;
    model?: string;
    type?: BikeType;
    color?: string;
  } | null>(null);
  const [overrideFields, setOverrideFields] = useState<{
    make: string;
    model: string;
    type: BikeType;
    color: string;
  } | null>(null);

  useEffect(() => {
    listTags()
      .then((t) => setTagSuggestions(t))
      .catch(() => setTagSuggestions([]));
  }, []);

  function tagsSuggestKids(tags: string[]) {
    const joined = tags.map((t) => t.trim().replace(/^#/, "").toLowerCase());
    return joined.some((t) => t === "kids" || t === "kid" || t.includes("kids") || t.includes("child") || t.includes("youth"));
  }

  async function runAiDetect(dataUrl: string) {
    setAiLoading(true);
    setAiTitle(null);
    setAiError(null);
    setAiFields(null);
    try {
      const resp = await fetch("/api/ai/bike", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: dataUrl }),
      });
      if (resp.ok) {
        const detected = (await resp.json()) as {
          brand: string | null;
          color: string | null;
          type: BikeType;
          title: string;
        };
        setAiTitle(detected.title);
        const brand = (detected.brand ?? "").trim();
        const normalizedTitle = detected.title.replace(/^Bike Hub\s*/i, "").trim();
        const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const stripRepeatedPrefix = (text: string, prefix: string) => {
          if (!prefix) return text.trim();
          const re = new RegExp(`^${escapeRegExp(prefix)}\\s+`, "i");
          let out = text.trim();
          while (re.test(out)) out = out.replace(re, "").trim();
          return out;
        };
        const modelFromTitle = brand ? stripRepeatedPrefix(normalizedTitle, brand) : normalizedTitle;
        const nextFields = {
          make: brand,
          model: modelFromTitle,
          type: detected.type,
          color: detected.color ?? "",
        };
        setAiFields(nextFields);
        setOverrideFields({
          make: nextFields.make ?? "",
          model: nextFields.model ?? "",
          type: nextFields.type ?? "other",
          color: nextFields.color ?? "",
        });
      } else {
        const errJson = (await resp.json().catch(() => null)) as
          | { error?: string; hint?: string; retry_after_seconds?: number }
          | null;
        const base = errJson?.error ?? "Auto title unavailable.";
        const hint = errJson?.hint ? ` ${errJson.hint}` : "";
        const retry =
          typeof errJson?.retry_after_seconds === "number" && Number.isFinite(errJson.retry_after_seconds)
            ? ` (Retry after ~${Math.max(0, Math.round(errJson.retry_after_seconds))}s)`
            : "";
        setAiError(`${base}${retry}${hint}`.trim());
      }
    } catch {
      setAiError("Auto title unavailable.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handlePhoto(file: File) {
    setLoadingPhoto(true);
    setError(null);
    try {
      const dataUrl = await compressPhoto(file);
      setPhotoPreview(dataUrl);
      setPhotoDataUrl(dataUrl);

      // AI detect (best-effort)
      await runAiDetect(dataUrl);
    } catch (err) {
      setError(storageErrorMessage(err));
      setPhotoPreview(null);
      setPhotoDataUrl(undefined);
      setAiTitle(null);
      setAiError(null);
      setAiFields(null);
      setOverrideFields(null);
    } finally {
      setLoadingPhoto(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    if (!photoDataUrl) {
      setError("Please add at least one photo.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const effective =
        overrideFields ??
        ({
          make: aiFields?.make ?? "",
          model: aiFields?.model ?? "",
          type: aiFields?.type ?? "other",
          color: aiFields?.color ?? "",
        } as const);

      const forceKids = tagsSuggestKids(sellingTags);
      const bike = await createBike(
        {
          photoDataUrl,
          selling_tags: sellingTags,
          make: effective.make,
          model: effective.model,
          type: forceKids ? "kids" : effective.type,
          color: effective.color,
        },
        session.email
      );
      router.push(`/bikes/${bike.id}`);
    } catch (err) {
      setError(storageErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Add donated bike</h1>
        <p className="text-sm text-zinc-500">Photo required · add a few selling points</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={loadingPhoto}
          className="relative flex aspect-[4/3] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-zinc-300 bg-white"
        >
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="Preview" className="h-full w-full object-contain" />
          ) : (
            <>
              <span className="text-4xl">📷</span>
              <span className="mt-2 text-sm font-medium text-brand">
                {loadingPhoto ? "Processing photo…" : "Tap to take or upload photo"}
              </span>
            </>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handlePhoto(file);
          }}
        />

        {(aiLoading || aiTitle || aiError) && (
          <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-700">AI detection</p>
                <p className="mt-1 text-sm text-zinc-600">
                  {aiLoading
                    ? "Detecting from photo…"
                    : aiTitle ?? aiError ?? "Auto title unavailable."}
                </p>
              </div>
              <button
                type="button"
                disabled={!photoDataUrl || aiLoading}
                onClick={() => photoDataUrl && runAiDetect(photoDataUrl)}
                className="shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 disabled:opacity-60"
              >
                Re-run AI
              </button>
            </div>

            {overrideFields && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="col-span-1 block text-xs font-semibold text-zinc-600">
                  Brand
                  <input
                    value={overrideFields.make}
                    onChange={(e) =>
                      setOverrideFields((p) => (p ? { ...p, make: e.target.value } : p))
                    }
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                    placeholder="e.g. Avanti"
                  />
                </label>
                <label className="col-span-1 block text-xs font-semibold text-zinc-600">
                  Type
                  <select
                    value={overrideFields.type}
                    onChange={(e) =>
                      setOverrideFields((p) =>
                        p ? { ...p, type: e.target.value as BikeType } : p
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
                  >
                    {BIKE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="col-span-1 block text-xs font-semibold text-zinc-600">
                  Color
                  <input
                    value={overrideFields.color}
                    onChange={(e) =>
                      setOverrideFields((p) => (p ? { ...p, color: e.target.value } : p))
                    }
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                    placeholder="e.g. black"
                  />
                </label>
                <label className="col-span-2 block text-xs font-semibold text-zinc-600">
                  Title
                  <input
                    value={[overrideFields.make, overrideFields.model].filter(Boolean).join(" ").trim()}
                    onChange={(e) => {
                      const next = e.target.value;
                      setOverrideFields((p) => (p ? { ...p, model: next } : p));
                    }}
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                    placeholder="e.g. Avanti black road bike"
                  />
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Tip: if you tag it as <strong>kids</strong>, we’ll auto-categorise it as a Kids bike on save.
                  </p>
                </label>
              </div>
            )}
          </div>
        )}

        <TagInput
          label="What's special about this bike? (Selling points)"
          value={sellingTags}
          onChange={(tags) => {
            setSellingTags(tags);
            // Optimistically add any new tags to suggestions so they can be reused
            setTagSuggestions((prev) => {
              const existing = new Set(prev.map((t) => t.toLowerCase()));
              const merged = [...prev];
              tags.forEach((t) => {
                if (!existing.has(t.toLowerCase())) merged.push(t);
              });
              return merged.sort((a, b) => a.localeCompare(b));
            });
          }}
          suggestions={tagSuggestions}
        />

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting || loadingPhoto}
          className="w-full rounded-xl bg-brand py-3.5 font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save bike"}
        </button>
      </form>
    </div>
  );
}
