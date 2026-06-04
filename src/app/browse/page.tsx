"use client";

import { useMemo, useState } from "react";
import {
  BikeHubNetworkBadge,
  BikeHubPageHero,
  BikeHubServiceStrip,
} from "@/components/BikeHubTheme";
import { BrandLogo } from "@/components/BrandLogo";
import { CustomerBikeCard } from "@/components/CustomerBikeCard";
import { BIKE_CATEGORIES, BIKE_TYPES, BRANCHES, type BikeCategory, type BikeType } from "@/lib/constants";
import { useBikes } from "@/hooks/useBikes";

export default function BrowsePage() {
  const [category, setCategory] = useState<BikeCategory>("all");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<BikeType | "all">("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const { bikes: availableRaw } = useBikes({ status: "available" });
  const { bikes: refurbRaw } = useBikes({ status: "refurb" });

  const filterFn = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = minPrice.trim() ? Number(minPrice) : null;
    const max = maxPrice.trim() ? Number(maxPrice) : null;

    return (bikes: typeof availableRaw) =>
      bikes.filter((b) => {
        if (category !== "all") {
          const isKids = b.type === "kids";
          if (category === "kids" ? !isKids : isKids) return false;
        }
        if (type !== "all" && b.type !== type) return false;
        if (q) {
          const hay = [
            b.make,
            b.model,
            b.color,
            b.frame_size,
            ...(b.selling_tags ?? []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (b.status === "available") {
          const price = b.asking_price ?? null;
          if (min != null && Number.isFinite(min) && (price ?? 0) < min) return false;
          if (max != null && Number.isFinite(max) && (price ?? 0) > max) return false;
        }
        return true;
      });
  }, [category, type, search, minPrice, maxPrice]);

  const available = filterFn(availableRaw);
  const refurb = filterFn(refurbRaw);

  return (
    <div className="min-h-screen bg-background">
      <BikeHubPageHero>
        <div className="mx-auto max-w-lg text-center">
          <BrandLogo variant="lockup" hideLocation className="inline-block" />
          <p className="mt-2 text-sm font-medium text-white/90">
            Quality refurbished bikes from Auckland community bike hubs
          </p>
          <BikeHubServiceStrip compact />
          <BikeHubNetworkBadge />
        </div>
      </BikeHubPageHero>

      <main className="mx-auto max-w-lg space-y-8 px-4 pb-6 pt-4">
        <div className="rounded-2xl border border-brand-light/80 bg-white px-4 py-3 shadow-sm ring-1 ring-brand-light">
          <h1 className="text-2xl font-bold text-zinc-900">Our bikes</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Available now and coming soon from the workshop — repairs, advice, and low-cost rides
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

        <input
          type="search"
          placeholder="Search bikes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-brand"
        />

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold text-zinc-700">
            Type
            <select
              value={type}
              onChange={(e) => setType(e.target.value as BikeType | "all")}
              className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-base"
            >
              <option value="all">All</option>
              {BIKE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm font-semibold text-zinc-700">
              Min $
              <input
                type="number"
                min="0"
                step="1"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-base"
              />
            </label>
            <label className="block text-sm font-semibold text-zinc-700">
              Max $
              <input
                type="number"
                min="0"
                step="1"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-base"
              />
            </label>
          </div>
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
              No bikes available in this category right now. Check back soon — new
              bikes arrive weekly. Test rides welcome at our hubs when stock is in.
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
            These bikes are being refurbished — visit the hub to ask about timing.
            Test rides welcome when they are ready.
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

        <footer className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark px-5 py-6 text-center text-white shadow-md">
          <p className="font-bold">Auckland community bike hubs</p>
          <p className="mt-2 text-sm text-white/90">
            Free or koha repairs, refurbished bikes, and friendly advice — test rides
            welcome.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-white/90">
            {BRANCHES.map((b) => (
              <li key={b.id}>
                <span className="font-semibold">{b.name}:</span> {b.address}
              </li>
            ))}
          </ul>
        </footer>
      </main>
    </div>
  );
}
