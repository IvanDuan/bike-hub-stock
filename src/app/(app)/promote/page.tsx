"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BikePhotoFrame } from "@/components/BikePhotoFrame";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useAuth } from "@/components/AuthProvider";
import { buildFacebookPost } from "@/lib/facebook-post";
import { markFbPosted } from "@/lib/bikes-api";
import { useBikes } from "@/hooks/useBikes";
import { useRefetchOnVisible } from "@/hooks/useRefetchOnVisible";

export default function PromotePage() {
  const { session } = useAuth();
  const { bikes, refresh } = useBikes({ status: "available" });
  useRefetchOnVisible(refresh);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const ready = useMemo(
    () =>
      bikes.filter(
        (b) =>
          (b.photos?.length ?? 0) > 0 &&
          (!b.last_fb_post_at ||
            Date.now() - new Date(b.last_fb_post_at).getTime() > 7 * 86400000)
      ),
    [bikes]
  );

  async function copyPost(bikeId: string) {
    const bike = bikes.find((b) => b.id === bikeId);
    if (!bike) return;
    await navigator.clipboard.writeText(buildFacebookPost(bike));
    setCopiedId(bikeId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <PullToRefresh onRefresh={refresh}>
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Promote on Facebook</h1>
        <p className="text-sm text-zinc-500">
          {ready.length} bike{ready.length !== 1 ? "s" : ""} ready to post
        </p>
      </div>

      {ready.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
          Nothing to post right now. Bikes need status Available, a photo, and
          either never posted or not posted in the last 7 days.
        </div>
      ) : (
        <div className="space-y-4">
          {ready.map((bike) => {
            const title =
              [bike.make, bike.model].filter(Boolean).join(" ") || "Untitled bike";
            return (
              <article
                key={bike.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200"
              >
                {bike.photos?.[0] && (
                  <BikePhotoFrame
                    src={bike.photos[0].url}
                    alt={title}
                    className="aspect-[4/3] w-full rounded-none"
                  />
                )}
                <div className="space-y-3 p-4">
                  <div>
                    <h2 className="font-semibold text-zinc-900">{title}</h2>
                    <p className="text-sm text-zinc-500">
                      {bike.frame_size} · ${bike.asking_price}
                    </p>
                  </div>
                  <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl bg-zinc-50 p-3 text-xs text-zinc-700">
                    {buildFacebookPost(bike)}
                  </pre>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => copyPost(bike.id)}
                      className="rounded-xl bg-brand py-2.5 text-xs font-semibold text-white"
                    >
                      {copiedId === bike.id ? "Copied" : "Copy"}
                    </button>
                    <Link
                      href={`/bikes/${bike.id}`}
                      className="flex items-center justify-center rounded-xl border border-zinc-200 py-2.5 text-xs font-medium text-zinc-700"
                    >
                      Details
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        if (session) {
                          markFbPosted(bike.id, session.email).then(refresh);
                        }
                      }}
                      className="rounded-xl border border-brand-light bg-brand-light py-2.5 text-xs font-medium text-brand-dark"
                    >
                      Posted
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}
