import type { ReactNode } from "react";
import Image from "next/image";
import { BikeHubHeroPattern } from "@/components/BikeHubTheme";
import { BRAND_ASSETS, SHOP_LOCATION, SHOP_NAME_BOLD } from "@/lib/brand";

type BrandLogoProps = {
  variant?: "banner" | "lockup";
  className?: string;
  /** Branch location line under "Bike Hub" (e.g. Mount Roskill, New Lynn). */
  location?: string;
  /** Hide branch/location line (e.g. login page for all hubs). */
  hideLocation?: boolean;
};

export function BrandLogo({
  variant = "lockup",
  className = "",
  location = SHOP_LOCATION,
  hideLocation = false,
}: BrandLogoProps) {
  if (variant === "banner") {
    return (
      <div className={`overflow-hidden rounded-2xl ${className}`}>
        <Image
          src={BRAND_ASSETS.banner}
          alt="Bike Hub"
          width={1024}
          height={244}
          className="h-auto w-full"
          priority
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="text-2xl font-extrabold leading-none tracking-tight text-white">
        {SHOP_NAME_BOLD}
      </p>
      {!hideLocation && (
        <p className="font-brand-hand text-xl leading-tight text-brand-yellow">
          {location}
        </p>
      )}
    </div>
  );
}

export function BrandHeaderBar({
  subtitle,
  trailing,
  location,
}: {
  subtitle?: string;
  trailing?: ReactNode;
  location?: string;
}) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-brand to-brand-dark px-4 py-3">
      <BikeHubHeroPattern className="opacity-[0.1]" />
      <div className="relative z-10 mx-auto flex max-w-lg items-center justify-between gap-3">
        <BrandLogo location={location} />
        <div className="flex shrink-0 flex-col items-end gap-1">
          {subtitle && <p className="text-xs text-white/85">{subtitle}</p>}
          <div className="flex items-center gap-2">
            {trailing}
          </div>
        </div>
      </div>
    </div>
  );
}
