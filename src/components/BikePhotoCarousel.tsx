"use client";

import { useEffect, useRef, useState } from "react";
import type { BikePhoto } from "@/lib/types";
import { BikePhotoFrame } from "./BikePhotoFrame";

type BikePhotoCarouselProps = {
  photos: BikePhoto[];
  title: string;
  className?: string;
};

export function BikePhotoCarousel({
  photos,
  title,
  className = "aspect-[4/3] w-full rounded-none",
}: BikePhotoCarouselProps) {
  const [index, setIndex] = useState(0);
  const prevCount = useRef(photos.length);

  useEffect(() => {
    setIndex((current) => Math.min(current, Math.max(photos.length - 1, 0)));
    prevCount.current = photos.length;
  }, [photos]);

  const hasMultiple = photos.length > 1;
  const current = photos[index];

  function goPrev() {
    setIndex((i) => (i === 0 ? photos.length - 1 : i - 1));
  }

  function goNext() {
    setIndex((i) => (i === photos.length - 1 ? 0 : i + 1));
  }

  return (
    <div className="relative bg-zinc-100">
      <BikePhotoFrame
        src={current?.url}
        alt={hasMultiple ? `${title} — photo ${index + 1}` : title}
        className={className}
        placeholderClassName="text-5xl text-zinc-300"
      />

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-black/65"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-black/65"
          >
            ›
          </button>
          <span className="absolute bottom-2 left-2 z-10 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            {index + 1} / {photos.length}
          </span>
        </>
      )}
    </div>
  );
}
