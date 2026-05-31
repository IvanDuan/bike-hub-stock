"use client";

import { useMemo, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { CustomerBikeCard } from "@/components/CustomerBikeCard";
import { BIKE_CATEGORIES, SHOP_NAME, type BikeCategory } from "@/lib/constants";
import { useBikes } from "@/hooks/useBikes";

export default function BrowsePage() {
  const [category, setCategory] = useState<BikeCategory>("all");
  const { bikes: availableRaw } = useBikes({ status: "available" });
  const { bikes: refurbRaw } = useBikes({ status: "refurb" });

  const filterByCategory = useMemo(
    () => (bikes: typeof availableRaw) =>
      category === "all"
        ? bikes
        : bikes.filter((b) =>
            category === "kids" ? b.type === "kids" : b.type !== "kids"
          ),
    [category]
  );

  const available = filterByCategory(availableRaw);
  const refurb = filterByCategory(refurbRaw);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-brand px-4 py-4">
        <div className="mx-auto max-w-lg">
          <BrandLogo />
          <p className="mt-2 text-sm text-white/90">
            Community bike shop — quality second-hand bikes
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-8 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Our bikes</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Available now and coming soon from our workshop
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-xl bg-zinc-100 p-1">
          {BIKE_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`rounded-lg py-2 text-xs font-semibold sm:text-sm ${
                category === cat.value
                  ? "bg-white text-brand-dark shadow-sm"
                  : "text-zinc-600"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-zinc-900">
            Available now
            <span className="ml-2 text-sm font-normal text-zinc-500">
              ({available.length})
            </span>
          </h2>
          {available.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">
              No bikes available in this category right now. Check back soon or
              message us — new bikes arrive weekly.
            </p>
          ) : (
            <div className="space-y-4">
              {available.map((bike) => (
                <CustomerBikeCard key={bike.id} bike={bike} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-zinc-900">
            In the workshop
            <span className="ml-2 text-sm font-normal text-zinc-500">
              ({refurb.length})
            </span>
          </h2>
          <p className="text-sm text-zinc-500">
            These bikes are being refurbished — ask us about timing or to reserve
            one early.
          </p>
          {refurb.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">
              Nothing in the workshop at the moment.
            </p>
          ) : (
            <div className="space-y-4">
              {refurb.map((bike) => (
                <CustomerBikeCard key={bike.id} bike={bike} />
              ))}
            </div>
          )}
        </section>

        <footer className="rounded-2xl bg-brand px-5 py-6 text-center text-white">
          <p className="font-bold">{SHOP_NAME}</p>
          <p className="mt-2 text-sm text-white/90">
            Message us on Facebook or visit the shop to view a bike or reserve
            one.
          </p>
        </footer>
      </main>
    </div>
  );
}
