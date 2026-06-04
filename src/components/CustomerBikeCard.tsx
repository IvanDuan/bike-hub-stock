import type { Bike } from "@/lib/types";
import { branchById } from "@/lib/constants";
import { buildPromoDescription, workshopVisitLine } from "@/lib/facebook-post";
import { BikePhotoCarousel } from "./BikePhotoCarousel";

export function CustomerBikeCard({ bike }: { bike: Bike }) {
  const photos = bike.photos ?? [];
  const title = [bike.make, bike.model].filter(Boolean).join(" ") || "Bike";
  const isAvailable = bike.status === "available";
  const branch = branchById(bike.branch_id);
  const intro =
    (bike.listing_description || "").trim() || buildPromoDescription(bike);

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <BikePhotoCarousel photos={photos} title={title} />
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
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {branch && (
            <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-semibold text-brand-dark">
              {branch.name}
            </span>
          )}
        </div>
        {isAvailable && bike.asking_price != null && (
          <p className="mt-2 text-lg font-bold text-brand">${bike.asking_price}</p>
        )}
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{intro}</p>
        {!isAvailable && (
          <p className="mt-2 text-sm text-amber-800">{workshopVisitLine(bike)}</p>
        )}
      </div>
    </article>
  );
}
