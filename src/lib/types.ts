import type { BikeStatus, BikeType } from "./constants";

export interface BikePhoto {
  id: string;
  bike_id: string;
  url: string;
  sort_order: number;
  uploaded_at: string;
}

export interface Bike {
  id: string;
  status: BikeStatus;
  make: string;
  model: string;
  type: BikeType;
  frame_size: string;
  color: string;
  condition_notes: string;
  listing_description: string;
  asking_price: number | null;
  sold_price: number | null;
  price_negotiable: boolean;
  donated_at: string | null;
  listed_at: string | null;
  sold_at: string | null;
  last_fb_post_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  photos?: BikePhoto[];
}

export type BikeInsert = Omit<
  Bike,
  "id" | "created_at" | "updated_at" | "photos"
> & { id?: string };

export interface DashboardStats {
  available: number;
  refurb: number;
  donated: number;
  reserved: number;
  soldThisMonth: number;
  readyToPromote: number;
  adultAvailable: number;
  kidsAvailable: number;
  totalInStock: number;
  soldAllTime: number;
  revenueThisMonth: number;
  revenueAllTime: number;
}

export interface StaffSession {
  email: string;
  name: string;
}
