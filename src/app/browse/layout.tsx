import type { Metadata } from "next";
import { BRAND_ASSETS } from "@/lib/brand";
import { SHOP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Bikes for sale — ${SHOP_NAME}`,
  description:
    "Browse available and upcoming refurbished bikes at Bike Hub Mount Roskill community bike shop.",
  openGraph: {
    title: `Bikes for sale — ${SHOP_NAME}`,
    description: "See what's available now and what's coming soon from our refurb workshop.",
    images: [{ url: BRAND_ASSETS.banner, width: 1024, height: 244, alt: SHOP_NAME }],
  },
};

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
