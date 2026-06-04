import { SHOP_NAME, branchById, typeLabel } from "./constants";
import type { Bike } from "./types";

function titleCaseWord(w: string) {
  return w ? w[0].toUpperCase() + w.slice(1) : w;
}

function normalizeSellingPoint(tag: string) {
  const t = tag.trim().replace(/^#/, "");
  if (!t) return "";
  // Keep it sentence-friendly (avoid all-lowercase hashtags).
  return t.includes(" ") ? t : titleCaseWord(t);
}

function branchAddressLine(branchId: Bike["branch_id"]): string | null {
  const branch = branchById(branchId);
  return branch ? branch.address : null;
}

/** Customer-facing CTA with the hub address for this bike (or both hubs if unknown). */
export function testRideVisitLine(bike: Bike): string {
  const address = branchAddressLine(bike.branch_id);
  if (address) {
    return `Test rides welcome — visit us at ${address}.`;
  }
  return (
    "Test rides welcome — Mount Roskill: 740 Sandringham Road, Mount Roskill; " +
    "New Lynn: EcoHub, 1 Olympic Place, New Lynn."
  );
}

export function workshopVisitLine(bike: Bike): string {
  const address = branchAddressLine(bike.branch_id);
  if (address) {
    return `Being refurbished — visit us at ${address} to ask when it will be ready.`;
  }
  return (
    "Being refurbished — visit Bike Hub Mount Roskill (740 Sandringham Road) or " +
    "Bike Hub New Lynn (1 Olympic Place) to ask when it will be ready."
  );
}

export function buildPromoDescription(bike: Bike): string {
  const type = typeLabel(bike.type);
  const color = bike.color?.trim();
  const size = bike.frame_size?.trim();

  const bits: string[] = [];
  bits.push(`${color ? `${titleCaseWord(color)} ` : ""}${type} bike`.trim());
  if (size) bits.push(`Size: ${size}`);

  const points = (bike.selling_tags ?? [])
    .map(normalizeSellingPoint)
    .filter(Boolean)
    // Avoid noisy meta-tags in customer-facing copy
    .filter((t) => !/^kids?$/i.test(t) && !/^adult$/i.test(t) && !/^ready(\s|-)?to(\s|-)?ride$/i.test(t))
    .slice(0, 5);

  if (points.length) {
    bits.push(`Highlights: ${points.join(", ")}.`);
    bits.push(testRideVisitLine(bike));
    return bits.join(" ");
  }

  bits.push(
    `Refurbished and checked by our community bike shop team. ${testRideVisitLine(bike)}`
  );
  return bits.join(" ");
}

export function buildFacebookPost(bike: Bike): string {
  const title = [bike.make, bike.model].filter(Boolean).join(" ") || "Bike";
  const size = bike.frame_size ? ` — ${bike.frame_size}` : "";
  const type = typeLabel(bike.type);
  const priceLine = bike.asking_price
    ? `Asking $${bike.asking_price}`
    : "Price on request";

  const description =
    (bike.listing_description || "").trim() || buildPromoDescription(bike) || `${type} bike ready to ride.`;

  return `🚲 Available at ${SHOP_NAME}!

${title}${size}
${priceLine}

${description}

Quality second-hand bikes from your community bike shop.
${testRideVisitLine(bike)}`;
}
