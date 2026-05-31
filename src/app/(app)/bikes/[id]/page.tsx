"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BikePhotoGallery } from "@/components/BikePhotoGallery";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/components/AuthProvider";
import { useBike } from "@/hooks/useBikes";
import { BIKE_STATUSES, type BikeStatus, typeLabel } from "@/lib/constants";
import { buildFacebookPost } from "@/lib/facebook-post";
import {
  addPhoto,
  deleteBike,
  deletePhoto,
  markFbPosted,
  updateBike,
} from "@/lib/bikes-api";
import type { Bike } from "@/lib/types";
import { compressPhoto } from "@/lib/compress-photo";
import { storageErrorMessage } from "@/lib/safe-storage";

export default function BikeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { bike, loading, refresh } = useBike(id);

  if (loading) {
    return <p className="py-12 text-center text-zinc-500">Loading bike…</p>;
  }

  if (!bike) {
    return (
      <div className="py-12 text-center text-zinc-500">
        Bike not found.{" "}
        <Link href="/" className="text-brand">
          Back to stock
        </Link>
      </div>
    );
  }

  return <BikeDetail bike={bike} onUpdate={refresh} />;
}

function BikeDetail({
  bike,
  onUpdate,
}: {
  bike: Bike;
  onUpdate: () => void;
}) {
  const { session } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [askingPrice, setAskingPrice] = useState(bike.asking_price?.toString() ?? "");
  const [soldPrice, setSoldPrice] = useState(bike.sold_price?.toString() ?? "");
  const [listingDescription, setListingDescription] = useState(bike.listing_description);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalAskingPrice, setModalAskingPrice] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setAskingPrice(bike.asking_price?.toString() ?? "");
    setSoldPrice(bike.sold_price?.toString() ?? "");
    setListingDescription(bike.listing_description);
  }, [bike]);

  const title = [bike.make, bike.model].filter(Boolean).join(" ") || "Untitled bike";

  async function update(patch: Partial<Bike>) {
    if (!session) return;
    setSaving(true);
    try {
      await updateBike(bike.id, patch, session.email);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function markAvailable(priceValue: string) {
    const price = parseFloat(priceValue);
    if (Number.isNaN(price) || price <= 0) {
      return "Enter a valid asking price.";
    }

    await update({
      status: "available",
      asking_price: price,
      listed_at: new Date().toISOString(),
      listing_description: listingDescription,
    });
    setAskingPrice(priceValue);
    setShowPriceModal(false);
    setModalError(null);
    return null;
  }

  async function setStatus(status: BikeStatus) {
    if (status === "available") {
      const priceValue =
        askingPrice.trim() || bike.asking_price?.toString() || "";

      if (!priceValue) {
        setModalAskingPrice("");
        setModalError(null);
        setShowPriceModal(true);
        return;
      }

      const error = await markAvailable(priceValue);
      if (error) {
        setModalAskingPrice(priceValue);
        setModalError(error);
        setShowPriceModal(true);
      }
      return;
    }

    const patch: Partial<Bike> = { status };

    if (status === "sold") {
      const sold = soldPrice ? parseFloat(soldPrice) : parseFloat(askingPrice);
      patch.sold_price = Number.isNaN(sold) ? bike.asking_price : sold;
      patch.sold_at = new Date().toISOString();
    }

    await update(patch);
  }

  async function confirmAvailableFromModal() {
    const error = await markAvailable(modalAskingPrice);
    if (error) setModalError(error);
  }

  async function copyPost() {
    await navigator.clipboard.writeText(buildFacebookPost(bike));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleAddPhoto(file: File) {
    if (!session) return;
    setAddingPhoto(true);
    try {
      await addPhoto(bike.id, await compressPhoto(file));
      onUpdate();
    } catch (err) {
      alert(storageErrorMessage(err));
    } finally {
      setAddingPhoto(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDeletePhoto(photoId: string) {
    if (!session) return;
    try {
      const ok = await deletePhoto(bike.id, photoId);
      if (!ok) {
        alert("At least one photo is required.");
        return;
      }
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete photo");
    }
  }

  async function handleDeleteBike() {
    if (!session) return;
    setDeleting(true);
    try {
      await deleteBike(bike.id);
      router.replace("/");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete bike");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm font-medium text-brand">
        ← Back to stock
      </Link>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
        <BikePhotoGallery
          photos={bike.photos ?? []}
          title={title}
          adding={addingPhoto}
          onAddPhoto={() => fileRef.current?.click()}
          onDeletePhoto={handleDeletePhoto}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleAddPhoto(file);
          }}
        />
        <div className="border-t border-zinc-100 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-zinc-900">{title}</h1>
              <p className="text-sm text-zinc-500">
                {typeLabel(bike.type)} · {bike.frame_size} · {bike.color}
              </p>
            </div>
            <StatusBadge status={bike.status} />
          </div>
          {bike.asking_price != null && (
            <p className="mt-2 text-lg font-semibold text-brand">${bike.asking_price}</p>
          )}
        </div>
      </div>

      {bike.condition_notes && (
        <section className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
          <h2 className="text-sm font-semibold text-zinc-700">Internal notes</h2>
          <p className="mt-1 text-sm text-zinc-600">{bike.condition_notes}</p>
        </section>
      )}

      {bike.status === "refurb" && (
        <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
          <h2 className="text-sm font-semibold text-zinc-700">Listing details</h2>
          <p className="text-xs text-zinc-500">
            Set asking price while in refurb, or you&apos;ll be prompted when marking Available.
          </p>
          <label className="block text-sm text-zinc-600">
            Asking price ($)
            <input
              type="number"
              min="1"
              step="1"
              value={askingPrice}
              onChange={(e) => setAskingPrice(e.target.value)}
              onBlur={() => {
                const price = parseFloat(askingPrice);
                if (!Number.isNaN(price) && price > 0) {
                  update({ asking_price: price, listing_description: listingDescription });
                }
              }}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-3"
              placeholder="e.g. 250"
            />
          </label>
          <label className="block text-sm text-zinc-600">
            Facebook description
            <textarea
              value={listingDescription}
              onChange={(e) => setListingDescription(e.target.value)}
              onBlur={() => update({ listing_description: listingDescription })}
              rows={3}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-3"
              placeholder="Recently refurbished with new tires…"
            />
          </label>
        </section>
      )}

      {bike.status === "available" && (
        <section className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
          <h2 className="text-sm font-semibold text-zinc-700">Listing description</h2>
          <label className="mt-2 block text-sm text-zinc-600">
            Facebook description
            <textarea
              value={listingDescription}
              onChange={(e) => setListingDescription(e.target.value)}
              onBlur={() => {
                if (session) update({ listing_description: listingDescription });
              }}
              rows={3}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-3"
            />
          </label>
        </section>
      )}

      <section className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Update status</h2>
        <div className="grid grid-cols-2 gap-2">
          {BIKE_STATUSES.filter((s) => s.value !== bike.status).map((s) => (
            <button
              key={s.value}
              type="button"
              disabled={saving}
              onClick={() => setStatus(s.value)}
              className="rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-700 hover:border-brand hover:bg-brand-light disabled:opacity-60"
            >
              → {s.label}
            </button>
          ))}
        </div>
      </section>

      {bike.status === "available" && (
        <section className="space-y-3 rounded-2xl bg-brand-light p-4 ring-1 ring-brand-light">
          <h2 className="text-sm font-semibold text-brand-dark">Facebook post</h2>
          <pre className="whitespace-pre-wrap rounded-xl bg-white p-3 text-xs text-zinc-700">
            {buildFacebookPost(bike)}
          </pre>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={copyPost}
              className="rounded-xl bg-brand py-2.5 text-sm font-semibold text-white"
            >
              {copied ? "Copied!" : "Copy post"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (session) markFbPosted(bike.id, session.email).then(onUpdate);
              }}
              className="rounded-xl border border-brand bg-white py-2.5 text-sm font-medium text-brand-dark"
            >
              Mark posted
            </button>
          </div>
        </section>
      )}

      {bike.status !== "sold" && (
        <section className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
          <h2 className="text-sm font-semibold text-zinc-700">Mark as sold</h2>
          <label className="mt-2 block text-sm text-zinc-600">
            Final sale price (optional)
            <input
              type="number"
              min="0"
              step="1"
              value={soldPrice}
              onChange={(e) => setSoldPrice(e.target.value)}
              placeholder={bike.asking_price?.toString() ?? "Same as asking"}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-3"
            />
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={() => setStatus("sold")}
            className="mt-3 w-full rounded-xl bg-zinc-900 py-3 font-semibold text-white disabled:opacity-60"
          >
            Mark sold
          </button>
        </section>
      )}

      {bike.status === "sold" && bike.sold_price != null && (
        <p className="text-center text-sm text-zinc-500">
          Sold for ${bike.sold_price}
          {bike.asking_price != null && bike.sold_price < bike.asking_price && (
            <> (${bike.asking_price - bike.sold_price} below asking)</>
          )}
        </p>
      )}

      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-4">
        <h2 className="text-sm font-semibold text-red-800">Remove from stock</h2>
        <p className="mt-1 text-sm text-red-700/80">
          Permanently delete this bike and all its photos.
          {bike.status === "sold" && " This will also remove its sale record from statistics."}
        </p>
        <button
          type="button"
          disabled={deleting || saving}
          onClick={() => setShowDeleteModal(true)}
          className="mt-3 w-full rounded-xl border border-red-300 bg-white py-3 text-sm font-semibold text-red-700 disabled:opacity-60"
        >
          Delete bike
        </button>
      </section>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
            role="dialog"
            aria-labelledby="delete-bike-title"
          >
            <h2 id="delete-bike-title" className="text-lg font-semibold text-zinc-900">
              Delete this bike?
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              <strong>{title}</strong> will be removed permanently, including all photos.
              {bike.status === "sold" && " Sale stats for this bike will be lost too."}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-zinc-200 py-3 text-sm font-medium text-zinc-700 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteBike}
                className="rounded-xl bg-red-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPriceModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
            role="dialog"
            aria-labelledby="asking-price-title"
          >
            <h2 id="asking-price-title" className="text-lg font-semibold text-zinc-900">
              Set asking price
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Required before this bike can be marked Available.
            </p>
            <label className="mt-4 block text-sm font-medium text-zinc-700">
              Asking price ($)
              <input
                type="number"
                min="1"
                step="1"
                autoFocus
                value={modalAskingPrice}
                onChange={(e) => {
                  setModalAskingPrice(e.target.value);
                  setModalError(null);
                }}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-3 text-base"
                placeholder="e.g. 250"
              />
            </label>
            {modalError && (
              <p className="mt-2 text-sm text-red-600">{modalError}</p>
            )}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPriceModal(false);
                  setModalError(null);
                }}
                className="rounded-xl border border-zinc-200 py-3 text-sm font-medium text-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAvailableFromModal}
                className="rounded-xl bg-brand py-3 text-sm font-semibold text-white"
              >
                Mark Available
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
