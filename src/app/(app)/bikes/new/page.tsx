"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BIKE_TYPES } from "@/lib/constants";
import { compressPhoto } from "@/lib/compress-photo";
import { storageErrorMessage } from "@/lib/safe-storage";
import { useAuth } from "@/components/AuthProvider";
import { createBike } from "@/lib/bikes-api";

export default function NewBikePage() {
  const router = useRouter();
  const { session } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    make: "",
    model: "",
    type: "hybrid" as (typeof BIKE_TYPES)[number]["value"],
    frame_size: "",
    color: "",
    condition_notes: "",
  });

  async function handlePhoto(file: File) {
    setLoadingPhoto(true);
    setError(null);
    try {
      const dataUrl = await compressPhoto(file);
      setPhotoPreview(dataUrl);
      setPhotoDataUrl(dataUrl);
    } catch (err) {
      setError(storageErrorMessage(err));
      setPhotoPreview(null);
      setPhotoDataUrl(undefined);
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
      const bike = await createBike({ ...form, photoDataUrl }, session.email);
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
        <p className="text-sm text-zinc-500">Photo required · status starts as Donated</p>
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
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handlePhoto(file);
          }}
        />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Make" value={form.make} onChange={(v) => setForm({ ...form, make: v })} required />
          <Field label="Model" value={form.model} onChange={(v) => setForm({ ...form, model: v })} />
        </div>

        <label className="block text-sm font-medium text-zinc-700">
          Type
          <select
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value as typeof form.type })
            }
            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-3"
          >
            {BIKE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Frame size" value={form.frame_size} onChange={(v) => setForm({ ...form, frame_size: v })} placeholder="M, 54cm…" />
          <Field label="Colour" value={form.color} onChange={(v) => setForm({ ...form, color: v })} />
        </div>

        <label className="block text-sm font-medium text-zinc-700">
          Condition notes (internal)
          <textarea
            value={form.condition_notes}
            onChange={(e) => setForm({ ...form, condition_notes: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-3"
            placeholder="Needs new chain, rust on fork…"
          />
        </label>

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

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <input
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-3"
      />
    </label>
  );
}
