import type { Bike } from "@/lib/types";
import { typeLabel } from "@/lib/constants";
import { BikePhotoFrame } from "./BikePhotoFrame";

export function CustomerBikeCard({ bike }: { bike: Bike }) {
  const photo = bike.photos?.[0];
  const title = [bike.make, bike.model].filter(Boolean).join(" ") || "Bike";
  const isAvailable = bike.status === "available";

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <BikePhotoFrame
        src={photo?.url}
        alt={title}
        className="aspect-[4/3] w-full rounded-none"
      />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isAvailable
                ? "bg-brand-light text-brand-dark"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {isAvailable ? "Available" : "In Refurb"}
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          {typeLabel(bike.type)}
          {[bike.frame_size, bike.color].filter(Boolean).length > 0 && (
            <> · {[bike.frame_size, bike.color].filter(Boolean).join(" · ")}</>
          )}
        </p>
        {isAvailable && bike.asking_price != null && (
          <p className="mt-2 text-lg font-bold text-brand">${bike.asking_price}</p>
        )}
        {!isAvailable && (
          <p className="mt-2 text-sm text-amber-800">
            Being refurbished — ask us when it will be ready.
          </p>
        )}
        {isAvailable && bike.listing_description && (
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            {bike.listing_description}
          </p>
        )}
      </div>
    </article>
  );
}
