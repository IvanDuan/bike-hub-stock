"use client";

import Link from "next/link";
import { useStats } from "@/hooks/useBikes";

function StatBlock({
  label,
  value,
  sub,
  href,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  accent?: string;
}) {
  const inner = (
    <>
      <p className="text-3xl font-bold text-zinc-900">{value}</p>
      <p className="mt-1 text-sm font-medium text-zinc-700">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </>
  );

  const className = `rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm ${accent ?? ""} ${
    href ? "transition hover:border-brand" : ""
  }`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}

export default function StatsPage() {
  const { stats, loading } = useStats();

  if (loading || !stats) {
    return <p className="text-zinc-500">Loading statistics…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Statistics</h1>
        <p className="text-sm text-zinc-500">Shop overview at a glance</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          On the floor
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatBlock
            label="Available"
            value={stats.available}
            href="/?status=available"
          />
          <StatBlock
            label="In Refurb"
            value={stats.refurb}
            href="/?status=refurb"
          />
          <StatBlock
            label="Donated (intake)"
            value={stats.donated}
            href="/?status=donated"
          />
          <StatBlock
            label="Reserved"
            value={stats.reserved}
            href="/?status=reserved"
          />
          <StatBlock
            label="Total in stock"
            value={stats.totalInStock}
            sub="Excludes sold"
            href="/"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          By category
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatBlock
            label="Adult bikes available"
            value={stats.adultAvailable}
            href="/?status=available&category=adult"
          />
          <StatBlock
            label="Kid bikes available"
            value={stats.kidsAvailable}
            href="/?status=available&category=kids"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Sales & promotion
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatBlock
            label="Sold this month"
            value={stats.soldThisMonth}
            href="/sold"
          />
          <StatBlock
            label="Ready to post"
            value={stats.readyToPromote}
            href="/promote"
            accent="ring-2 ring-brand-light"
          />
          <StatBlock
            label="Revenue this month"
            value={`$${stats.revenueThisMonth.toLocaleString()}`}
            sub="Recorded sale prices"
          />
          <StatBlock
            label="All-time sold"
            value={stats.soldAllTime}
            sub={`$${stats.revenueAllTime.toLocaleString()} total`}
            href="/sold"
          />
        </div>
      </section>
    </div>
  );
}
