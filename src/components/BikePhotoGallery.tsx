"use client";

import { useEffect, useRef, useState } from "react";
import type { BikePhoto } from "@/lib/types";
import { BikePhotoFrame } from "./BikePhotoFrame";

type BikePhotoGalleryProps = {
  photos: BikePhoto[];
  title: string;
  onAddPhoto: () => void;
  onDeletePhoto: (photoId: string) => void;
  adding?: boolean;
};

export function BikePhotoGallery({
  photos,
  title,
  onAddPhoto,
  onDeletePhoto,
  adding = false,
}: BikePhotoGalleryProps) {
  const [index, setIndex] = useState(0);
  const prevCount = useRef(photos.length);

  useEffect(() => {
    if (photos.length > prevCount.current) {
      setIndex(photos.length - 1);
    } else {
      setIndex((current) => Math.min(current, Math.max(photos.length - 1, 0)));
    }
    prevCount.current = photos.length;
  }, [photos]);

  const hasMultiple = photos.length > 1;
  const current = photos[index];
  const canDelete = photos.length > 1;

  function goPrev() {
    setIndex((i) => (i === 0 ? photos.length - 1 : i - 1));
  }

  function goNext() {
    setIndex((i) => (i === photos.length - 1 ? 0 : i + 1));
  }

  function handleDelete(photoId: string) {
    onDeletePhoto(photoId);
  }

  return (
    <div className="space-y-3">
      <div className="relative bg-zinc-100">
        <BikePhotoFrame
          src={current?.url}
          alt={hasMultiple ? `${title} — photo ${index + 1}` : title}
          className="aspect-[4/3] w-full rounded-none"
          placeholderClassName="text-5xl text-zinc-300"
        />

        {canDelete && current && (
          <button
            type="button"
            onClick={() => handleDelete(current.id)}
            aria-label="Delete this photo"
            className="absolute right-2 top-2 rounded-full bg-red-600/90 px-2.5 py-1 text-xs font-semibold text-white shadow hover:bg-red-700"
          >
            Delete
          </button>
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-black/65"
            >
              ‹ Prev
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-black/65"
            >
              Next ›
            </button>
            <span className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              {index + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      {photos.length > 0 && (
        <div className="flex gap-3 overflow-x-auto px-4 py-2">
          {photos.map((photo, i) => (
            <div key={photo.id} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`View photo ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                className={`block overflow-hidden rounded-xl transition ${
                  i === index
                    ? "border-2 border-brand"
                    : "border-2 border-transparent opacity-75 hover:opacity-100"
                }`}
              >
                <BikePhotoFrame
                  src={photo.url}
                  alt=""
                  className="aspect-[4/3] w-16 rounded-lg"
                />
              </button>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(photo.id)}
                  aria-label={`Delete photo ${i + 1}`}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold leading-none text-white shadow ring-2 ring-white hover:bg-red-700"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={onAddPhoto}
          disabled={adding}
          className="w-full rounded-xl border border-zinc-300 bg-white py-3 text-sm font-medium text-zinc-700 disabled:opacity-60"
        >
          {adding ? "Adding photo…" : "+ Add photo"}
        </button>
      </div>
    </div>
  );
}
