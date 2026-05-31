"use client";

import Link from "next/link";
import { BikeCard } from "@/components/BikeCard";
import { useBikes } from "@/hooks/useBikes";

export default function SoldPage() {
  const { bikes } = useBikes({ status: "sold" });

  const totalRevenue = bikes.reduce((sum, b) => sum + (b.sold_price ?? 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Sold bikes</h1>
        <p className="text-sm text-zinc-500">
          {bikes.length} sold · ${totalRevenue.toLocaleString()} recorded revenue
        </p>
      </div>

      {bikes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
          No sold bikes yet.
        </div>
      ) : (
        <div className="space-y-3">
          {bikes.map((bike) => (
            <div key={bike.id}>
              <BikeCard bike={bike} />
              {bike.sold_at && (
                <p className="mt-1 px-1 text-xs text-zinc-400">
                  Sold {new Date(bike.sold_at).toLocaleDateString()}
                  {bike.sold_price != null && bike.asking_price != null &&
                    bike.sold_price < bike.asking_price && (
                      <> · negotiated down ${bike.asking_price - bike.sold_price}</>
                    )}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Link href="/" className="block text-center text-sm font-medium text-brand">
        View all stock →
      </Link>
    </div>
  );
}
