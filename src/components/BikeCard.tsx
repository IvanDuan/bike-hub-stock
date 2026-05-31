import Link from "next/link";
import type { Bike } from "@/lib/types";
import { BikePhotoFrame } from "./BikePhotoFrame";
import { StatusBadge } from "./StatusBadge";

export function BikeCard({ bike }: { bike: Bike }) {
  const photo = bike.photos?.[0];
  const title = [bike.make, bike.model].filter(Boolean).join(" ") || "Untitled bike";

  return (
    <Link
      href={`/bikes/${bike.id}`}
      className="flex gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-brand hover:shadow-md active:scale-[0.99]"
    >
      <BikePhotoFrame
        src={photo?.url}
        alt={title}
        className="aspect-[4/3] w-24"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold text-zinc-900">{title}</h3>
          <StatusBadge status={bike.status} />
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          {[bike.frame_size, bike.color].filter(Boolean).join(" · ")}
        </p>
        {bike.asking_price != null && bike.status === "available" && (
          <p className="mt-1 text-sm font-medium text-brand">${bike.asking_price}</p>
        )}
      </div>
    </Link>
  );
}
