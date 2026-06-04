export const SHOP_NAME = "Bike Hub Mount Roskill";

export const BRANCHES = [
  {
    id: "mt-roskill",
    name: "Bike Hub Mount Roskill",
    location: "Mount Roskill",
    address: "740 Sandringham Road, Mount Roskill",
  },
  {
    id: "new-lynn",
    name: "Bike Hub New Lynn",
    location: "New Lynn",
    address: "EcoHub, 1 Olympic Place, New Lynn",
  },
] as const;

export type BranchId = (typeof BRANCHES)[number]["id"];

export function branchById(branchId: BranchId | null | undefined) {
  if (!branchId) return undefined;
  return BRANCHES.find((b) => b.id === branchId);
}

export function branchLocation(branchId: BranchId | null | undefined): string {
  return branchById(branchId)?.location ?? BRANCHES[0].location;
}

export const BIKE_STATUSES = [
  { value: "donated", label: "Donated", color: "bg-slate-100 text-slate-700" },
  { value: "refurb", label: "In Refurb", color: "bg-amber-100 text-amber-800" },
  { value: "available", label: "Available", color: "bg-emerald-100 text-emerald-800" },
  { value: "reserved", label: "Reserved", color: "bg-blue-100 text-blue-800" },
  { value: "sold", label: "Sold", color: "bg-zinc-200 text-zinc-600" },
] as const;

export const BIKE_TYPES = [
  { value: "road", label: "Road" },
  { value: "hybrid", label: "Hybrid" },
  { value: "mtb", label: "Mountain" },
  { value: "kids", label: "Kids" },
  { value: "bmx", label: "BMX" },
  { value: "cruiser", label: "Cruiser" },
  { value: "other", label: "Other" },
] as const;

export type BikeStatus = (typeof BIKE_STATUSES)[number]["value"];
export type BikeType = (typeof BIKE_TYPES)[number]["value"];

export const BIKE_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "adult", label: "Adult bikes" },
  { value: "kids", label: "Kid bikes" },
] as const;

export type BikeCategory = (typeof BIKE_CATEGORIES)[number]["value"];

export function isKidsBike(type: BikeType): boolean {
  return type === "kids";
}

export function matchesCategory(type: BikeType, category: BikeCategory): boolean {
  if (category === "all") return true;
  if (category === "kids") return isKidsBike(type);
  return !isKidsBike(type);
}

export function statusLabel(status: BikeStatus): string {
  return BIKE_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function statusColor(status: BikeStatus): string {
  return BIKE_STATUSES.find((s) => s.value === status)?.color ?? "bg-zinc-100 text-zinc-700";
}

export function typeLabel(type: BikeType): string {
  return BIKE_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function isDemoMode(): boolean {
  return (
    process.env.NEXT_PUBLIC_USE_DEMO === "true" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
