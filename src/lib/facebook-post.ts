import { SHOP_NAME, branchById, typeLabel, type BikeType } from "./constants";
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

function typePhrase(type: BikeType): string {
  const phrases: Record<BikeType, string> = {
    road: "road bike",
    hybrid: "hybrid bike",
    mtb: "mountain bike",
    kids: "kids bike",
    bmx: "BMX",
    cruiser: "cruiser",
    other: "bike",
  };
  return phrases[type] ?? "bike";
}

function bikeOpening(bike: Bike): string {
  const color = bike.color?.trim();
  const make = bike.make?.trim();
  const model = bike.model?.trim();
  const phrase = typePhrase(bike.type);
  const nameParts: string[] = [];
  if (color) nameParts.push(titleCaseWord(color));
  if (make) nameParts.push(make);
  if (model && model.toLowerCase() !== make?.toLowerCase()) nameParts.push(model);
  if (nameParts.length === 0) return `This ${phrase}`;
  return `${nameParts.join(" ")} ${phrase}`;
}

function sellingFeaturesPhrase(points: string[]): string {
  const parts = points.map((t) => t.toLowerCase());
  if (parts.length === 1) return ` with ${parts[0]}`;
  if (parts.length === 2) return ` with ${parts[0]} and ${parts[1]}`;
  return ` with ${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function promoCloser(points: string[], type: BikeType): string {
  const hay = points.join(" ").toLowerCase();
  if (/commute|commuter|city|urban|work/.test(hay)) return " Your perfect commute partner.";
  if (/comfort|comfy|easy|relaxed|leisure/.test(hay)) return " A comfortable, easy-going ride.";
  if (/family|kids|child|young/.test(hay) || type === "kids") {
    return " Great for families and growing riders.";
  }
  if (/trail|mountain|adventure|off[- ]?road|rugged|robust/.test(hay) || type === "mtb") {
    return " Ready for your next adventure.";
  }
  if (/fast|light|sport|fitness/.test(hay) || type === "road") {
    return " Built for fitness and fun on the road.";
  }
  if (points.length >= 2) return " A quality refurbished find from our hub.";
  if (points.length === 1) return " A great value ride from our community workshop.";
  return "";
}

export function buildPromoDescription(bike: Bike): string {
  const size = bike.frame_size?.trim();
  const points = (bike.selling_tags ?? [])
    .map(normalizeSellingPoint)
    .filter(Boolean)
    .filter((t) => !/^kids?$/i.test(t) && !/^adult$/i.test(t) && !/^ready(\s|-)?to(\s|-)?ride$/i.test(t))
    .slice(0, 5);

  let body = bikeOpening(bike);
  if (points.length) {
    body += `${sellingFeaturesPhrase(points)}.`;
    body += promoCloser(points, bike.type);
  } else {
    body += ". Refurbished and checked by our community bike shop team.";
  }
  if (size) body += ` Size ${size}.`;
  body += ` ${testRideVisitLine(bike)}`;
  return body.replace(/\s+/g, " ").trim();
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
