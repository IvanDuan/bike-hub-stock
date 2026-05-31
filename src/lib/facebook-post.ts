import { SHOP_NAME } from "./constants";
import type { Bike } from "./types";
import { typeLabel } from "./constants";

export function buildFacebookPost(bike: Bike): string {
  const title = [bike.make, bike.model].filter(Boolean).join(" ") || "Bike";
  const size = bike.frame_size ? ` — ${bike.frame_size}` : "";
  const type = typeLabel(bike.type);
  const priceLine = bike.asking_price
    ? `Asking $${bike.asking_price}`
    : "Price on request";

  const description =
    bike.listing_description.trim() ||
    `${type} bike in good working order from our community refurb programme.`;

  return `🚲 Available at ${SHOP_NAME}!

${title}${size}
${priceLine}

${description}

Quality second-hand bikes from your community bike shop.
Message us to view or reserve.`;
}
