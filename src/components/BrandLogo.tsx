import type { ReactNode } from "react";
import Image from "next/image";
import { BRAND_ASSETS, SHOP_LOCATION, SHOP_NAME_BOLD } from "@/lib/brand";

type BrandLogoProps = {
  variant?: "banner" | "lockup";
  className?: string;
};

export function BrandLogo({ variant = "lockup", className = "" }: BrandLogoProps) {
  if (variant === "banner") {
    return (
      <div className={`overflow-hidden rounded-2xl ${className}`}>
        <Image
          src={BRAND_ASSETS.banner}
          alt="Bike Hub Mount Roskill"
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
      <p className="font-brand-hand text-xl leading-tight text-brand-yellow">
        {SHOP_LOCATION}
      </p>
    </div>
  );
}

export function BrandHeaderBar({
  subtitle,
  onSignOut,
  trailing,
}: {
  subtitle?: string;
  onSignOut?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <div className="bg-brand px-4 py-3">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        <BrandLogo />
        <div className="flex shrink-0 flex-col items-end gap-1">
          {subtitle && <p className="text-xs text-white/85">{subtitle}</p>}
          <div className="flex items-center gap-2">
            {trailing}
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/10"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
