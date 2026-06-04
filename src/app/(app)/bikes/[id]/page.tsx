"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BikePhotoGallery } from "@/components/BikePhotoGallery";
import { Modal } from "@/components/Modal";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/components/AuthProvider";
import { useBike } from "@/hooks/useBikes";
import { BIKE_STATUSES, type BikeStatus, typeLabel } from "@/lib/constants";
import {
  addPhoto,
  deleteBike,
  deletePhoto,
  markFbPosted,
  updateBike,
} from "@/lib/bikes-api";
import type { Bike } from "@/lib/types";
import { compressPhoto } from "@/lib/compress-photo";
import { requestListingDescription } from "@/lib/request-listing-description";
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
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [modalAskingPrice, setModalAskingPrice] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSoldPrice, setModalSoldPrice] = useState("");
  const [modalSoldError, setModalSoldError] = useState<string | null>(null);
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [regeneratingListing, setRegeneratingListing] = useState(false);

  const onShopFloor = bike.status === "available" || bike.status === "refurb";

  async function ensureListingDescription(force = false) {
    setRegeneratingListing(true);
    try {
      await requestListingDescription(bike.id, { force });
      onUpdate();
    } catch {
      // ignore — browse falls back to template text
    } finally {
      setRegeneratingListing(false);
    }
  }

  useEffect(() => {
    setAskingPrice(bike.asking_price?.toString() ?? "");
    setSoldPrice(bike.sold_price?.toString() ?? "");
  }, [bike]);

  useEffect(() => {
    if (!onShopFloor) return;
    if ((bike.listing_description || "").trim()) return;
    void ensureListingDescription(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bike.id, bike.status, bike.listing_description]);

  const title = [bike.make, bike.model].filter(Boolean).join(" ") || "Untitled bike";
  const canEditAskingPrice =
    bike.status === "refurb" ||
    bike.status === "available" ||
    bike.status === "reserved";

  function saveAskingPrice() {
    const price = parseFloat(askingPrice);
    if (Number.isNaN(price) || price <= 0) return;
    if (price === bike.asking_price) return;
    update({ asking_price: price });
  }

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
    });
    void ensureListingDescription(true);
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
      if (bike.status !== "sold") {
        // Collect optional final price after status change intent.
        setModalSoldPrice(soldPrice.trim() || "");
        setModalSoldError(null);
        setShowSoldModal(true);
        return;
      }
    }

    await update(patch);
    if (status === "refurb") {
      void ensureListingDescription(true);
    }
  }

  async function confirmAvailableFromModal() {
    const error = await markAvailable(modalAskingPrice);
    if (error) setModalError(error);
  }

  async function confirmSoldFromModal() {
    const sold =
      modalSoldPrice.trim() !== ""
        ? parseFloat(modalSoldPrice)
        : soldPrice
          ? parseFloat(soldPrice)
          : parseFloat(askingPrice);

    const patch: Partial<Bike> = {
      status: "sold",
      sold_at: new Date().toISOString(),
      sold_price: Number.isNaN(sold) ? bike.asking_price : sold,
    };

    await update(patch);
    setSoldPrice((patch.sold_price ?? "").toString());
    setShowSoldModal(false);
    setModalSoldError(null);
  }

  async function copyPost() {
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

      {onShopFloor && (
        <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
          <h2 className="text-sm font-semibold text-zinc-700">Customer listing text</h2>
          <p className="text-xs text-zinc-500">
            Shown on the public browse page. Generated with AI from selling points and bike
            details.
          </p>
          {bike.listing_description?.trim() ? (
            <p className="text-sm leading-relaxed text-zinc-600">{bike.listing_description}</p>
          ) : (
            <p className="text-sm text-zinc-400">
              {regeneratingListing ? "Generating…" : "Not generated yet."}
            </p>
          )}
          <button
            type="button"
            disabled={regeneratingListing || saving}
            onClick={() => ensureListingDescription(true)}
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 text-sm font-medium text-zinc-700 disabled:opacity-60"
          >
            {regeneratingListing ? "Generating…" : "Regenerate listing text"}
          </button>
        </section>
      )}

      {canEditAskingPrice && (
        <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
          <h2 className="text-sm font-semibold text-zinc-700">Listing details</h2>
          {bike.status === "refurb" && (
            <p className="text-xs text-zinc-500">
              Set asking price while in refurb, or you&apos;ll be prompted when marking Available.
            </p>
          )}
          <label className="block text-sm text-zinc-600">
            Asking price ($)
            <input
              type="number"
              min="1"
              step="1"
              value={askingPrice}
              onChange={(e) => setAskingPrice(e.target.value)}
              onBlur={saveAskingPrice}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-3"
              placeholder="e.g. 250"
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

      {bike.status === "sold" && (
        <section className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
          <h2 className="text-sm font-semibold text-zinc-700">Sold</h2>
          <label className="mt-2 block text-sm text-zinc-600">
            Final sale price
            <input
              type="number"
              min="0"
              step="1"
              value={soldPrice}
              onChange={(e) => setSoldPrice(e.target.value)}
              onBlur={() => {
                const sold = parseFloat(soldPrice);
                if (!Number.isNaN(sold) && sold !== bike.sold_price) update({ sold_price: sold });
              }}
              placeholder={bike.asking_price?.toString() ?? "Same as asking"}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-3"
            />
          </label>
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

      <Modal
        open={showDeleteModal}
        onClose={() => !deleting && setShowDeleteModal(false)}
        title="Delete this bike?"
        titleId="delete-bike-title"
      >
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
      </Modal>

      <Modal
        open={showPriceModal}
        onClose={() => {
          setShowPriceModal(false);
          setModalError(null);
        }}
        title="Set asking price"
        titleId="asking-price-title"
      >
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
        {modalError && <p className="mt-2 text-sm text-red-600">{modalError}</p>}
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
      </Modal>

      <Modal
        open={showSoldModal}
        onClose={() => {
          setShowSoldModal(false);
          setModalSoldError(null);
        }}
        title="Mark as sold"
        titleId="sold-price-title"
      >
        <p className="mt-1 text-sm text-zinc-500">
          Optional: enter the final sale price. Leave blank to use the asking price.
        </p>
        <label className="mt-4 block text-sm font-medium text-zinc-700">
          Final sale price ($)
          <input
            type="number"
            min="0"
            step="1"
            autoFocus
            value={modalSoldPrice}
            onChange={(e) => {
              setModalSoldPrice(e.target.value);
              setModalSoldError(null);
            }}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-3 text-base"
            placeholder={bike.asking_price?.toString() ?? "Same as asking"}
          />
        </label>
        {modalSoldError && <p className="mt-2 text-sm text-red-600">{modalSoldError}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setShowSoldModal(false);
              setModalSoldError(null);
            }}
            className="rounded-xl border border-zinc-200 py-3 text-sm font-medium text-zinc-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmSoldFromModal}
            className="rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white"
          >
            Mark Sold
          </button>
        </div>
      </Modal>
    </div>
  );
}
