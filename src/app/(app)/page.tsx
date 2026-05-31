"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BikeCard } from "@/components/BikeCard";
import { BIKE_CATEGORIES, BIKE_STATUSES, type BikeCategory } from "@/lib/constants";
import { useBikes } from "@/hooks/useBikes";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const categoryParam = (searchParams.get("category") as BikeCategory | null) ?? "all";
  const [search, setSearch] = useState("");

  const filters = useMemo(
    () => ({
      status: statusParam as (typeof BIKE_STATUSES)[number]["value"] | undefined,
      search: search || undefined,
      category: categoryParam,
    }),
    [statusParam, search, categoryParam]
  );

  const { bikes } = useBikes(filters);

  function setCategory(category: BikeCategory) {
    const params = new URLSearchParams(searchParams.toString());
    if (category === "all") {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    const q = params.toString();
    router.replace(q ? `/?${q}` : "/");
  }

  function setStatus(status: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!status) {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    const q = params.toString();
    router.replace(q ? `/?${q}` : "/");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Stock</h1>
          <p className="text-sm text-zinc-500">{bikes.length} bikes</p>
        </div>
        <Link
          href="/bikes/new"
          className="shrink-0 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
        >
          + Add
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-xl bg-zinc-100 p-1.5 ring-1 ring-zinc-200">
        {BIKE_CATEGORIES.map((cat) => {
          const selected = categoryParam === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              aria-pressed={selected}
              className={`rounded-lg py-2.5 text-xs font-bold transition sm:text-sm ${
                selected
                  ? "bg-brand text-white shadow-md ring-2 ring-brand-yellow"
                  : "text-zinc-600 hover:bg-white/70 hover:text-zinc-900"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      <input
        type="search"
        placeholder="Search make, model, size, color…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-brand"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setStatus(null)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
            !statusParam ? "bg-brand text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200"
          }`}
        >
          All
        </button>
        {BIKE_STATUSES.filter((s) => s.value !== "sold").map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setStatus(s.value)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
              statusParam === s.value
                ? "bg-brand text-white"
                : "bg-white text-zinc-600 ring-1 ring-zinc-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {bikes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
            No bikes match your filters.
          </div>
        ) : (
          bikes.map((bike) => <BikeCard key={bike.id} bike={bike} />)
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<p className="text-zinc-500">Loading stock…</p>}>
      <HomeContent />
    </Suspense>
  );
}
