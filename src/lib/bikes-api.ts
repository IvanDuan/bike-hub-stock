import { createClient } from "@/lib/supabase/client";
import type { BikeCategory, BikeStatus, BikeType } from "@/lib/constants";
import { isKidsBike, matchesCategory } from "@/lib/constants";
import { isDemoMode } from "@/lib/constants";
import { demoStore } from "@/lib/demo-store";
import { dataUrlToBlob } from "@/lib/data-url";
import type { Bike, BikePhoto, DashboardStats } from "@/lib/types";
import { newId } from "@/lib/safe-storage";

const BUCKET = "bike-photos";

type DbPhoto = {
  id: string;
  bike_id: string;
  storage_path: string;
  sort_order: number;
  uploaded_at: string;
};

type DbBike = {
  id: string;
  status: BikeStatus;
  branch_id?: string | null;
  make: string;
  model: string;
  type: BikeType;
  frame_size: string;
  color: string;
  condition_notes: string;
  listing_description: string;
  selling_tags?: string[] | null;
  asking_price: number | null;
  sold_price: number | null;
  price_negotiable: boolean;
  donated_at: string | null;
  listed_at: string | null;
  sold_at: string | null;
  last_fb_post_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  bike_photos?: DbPhoto[];
};

function photoPublicUrl(storagePath: string): string {
  const supabase = createClient();
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

function mapPhoto(row: DbPhoto): BikePhoto {
  return {
    id: row.id,
    bike_id: row.bike_id,
    url: row.storage_path.startsWith("http")
      ? row.storage_path
      : photoPublicUrl(row.storage_path),
    sort_order: row.sort_order,
    uploaded_at: row.uploaded_at,
  };
}

function mapBike(row: DbBike): Bike {
  const photos = (row.bike_photos ?? [])
    .map(mapPhoto)
    .sort((a, b) => a.sort_order - b.sort_order);

  return {
    id: row.id,
    status: row.status,
    make: row.make,
    model: row.model,
    type: row.type,
    frame_size: row.frame_size,
    color: row.color,
    condition_notes: row.condition_notes,
    listing_description: row.listing_description,
    selling_tags: row.selling_tags ?? undefined,
    asking_price: row.asking_price,
    sold_price: row.sold_price,
    price_negotiable: row.price_negotiable,
    donated_at: row.donated_at,
    listed_at: row.listed_at,
    sold_at: row.sold_at,
    last_fb_post_at: row.last_fb_post_at,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    branch_id: (row.branch_id as Bike["branch_id"]) ?? undefined,
    photos,
  };
}

const BIKE_SELECT = "*, bike_photos(id, bike_id, storage_path, sort_order, uploaded_at)";

export type BikeFilters = {
  status?: BikeStatus | BikeStatus[];
  search?: string;
  category?: BikeCategory;
};

export async function listBikes(filters?: BikeFilters): Promise<Bike[]> {
  if (isDemoMode()) {
    return demoStore.listBikes(filters);
  }

  const supabase = createClient();
  let query = supabase
    .from("bikes")
    .select(BIKE_SELECT)
    .order("updated_at", { ascending: false });

  if (filters?.status) {
    const statuses = Array.isArray(filters.status)
      ? filters.status
      : [filters.status];
    query = query.in("status", statuses);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let bikes = (data as DbBike[]).map(mapBike);

  if (filters?.category && filters.category !== "all") {
    bikes = bikes.filter((b) => matchesCategory(b.type, filters.category!));
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    bikes = bikes.filter(
      (b) =>
        b.make.toLowerCase().includes(q) ||
        b.model.toLowerCase().includes(q) ||
        b.color.toLowerCase().includes(q) ||
        b.frame_size.toLowerCase().includes(q)
    );
  }

  return bikes;
}

export async function getBike(bikeId: string): Promise<Bike | null> {
  if (isDemoMode()) {
    return demoStore.getBike(bikeId);
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("bikes")
    .select(BIKE_SELECT)
    .eq("id", bikeId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapBike(data as DbBike);
}

export async function createBike(
  input: {
    make?: string;
    model?: string;
    type?: BikeType;
    frame_size?: string;
    color?: string;
    condition_notes?: string;
    selling_tags?: string[];
    photoDataUrl?: string;
  },
  staffEmail: string
): Promise<Bike> {
  if (isDemoMode()) {
    return demoStore.createBike(input as any, staffEmail);
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("branch_id")
    .eq("id", user.id)
    .maybeSingle();

  const branchId = (profile?.branch_id as string | null | undefined) ?? null;
  if (!branchId) {
    throw new Error("Your account has no branch assigned yet.");
  }

  const timestamp = new Date().toISOString();
  const { data: bike, error } = await supabase
    .from("bikes")
    .insert({
      branch_id: branchId,
      status: "donated",
      make: input.make ?? "",
      model: input.model ?? "",
      type: input.type ?? "other",
      frame_size: input.frame_size ?? "",
      color: input.color ?? "",
      condition_notes: input.condition_notes ?? "",
      selling_tags: input.selling_tags ?? [],
      donated_at: timestamp,
      created_by: user.id,
      updated_by: user.id,
    })
    .select(BIKE_SELECT)
    .single();

  if (error) throw new Error(error.message);

  // Upsert tags for reuse (best-effort; don't block bike creation)
  try {
    if (input.selling_tags && input.selling_tags.length > 0) {
      const unique = Array.from(
        new Set(input.selling_tags.map((t) => t.trim()).filter(Boolean))
      );
      if (unique.length > 0) {
        await supabase.from("tags").upsert(
          unique.map((name) => ({ branch_id: branchId, name, created_by: user.id })),
          { onConflict: "branch_id,name", ignoreDuplicates: true }
        );
      }
    }
  } catch {
    // ignore
  }

  if (input.photoDataUrl) {
    await addPhoto(bike.id, input.photoDataUrl);
    return (await getBike(bike.id))!;
  }

  return mapBike(bike as DbBike);
}

export async function listTags(): Promise<string[]> {
  if (isDemoMode()) {
    return demoStore.listTags();
  }
  const supabase = createClient();
  const { data, error } = await supabase.from("tags").select("name").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: { name: string }) => r.name);
}

export async function updateBike(
  bikeId: string,
  patch: Partial<Bike>,
  staffEmail: string
): Promise<Bike | null> {
  if (isDemoMode()) {
    return demoStore.updateBike(bikeId, patch, staffEmail);
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { photos, id, created_at, created_by, ...dbPatch } = patch;
  void photos;
  void id;
  void created_at;
  void created_by;

  const { error } = await supabase
    .from("bikes")
    .update({
      ...dbPatch,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", bikeId);

  if (error) throw new Error(error.message);
  return getBike(bikeId);
}

export async function addPhoto(
  bikeId: string,
  photoDataUrl: string
): Promise<BikePhoto | null> {
  if (isDemoMode()) {
    return demoStore.addPhoto(bikeId, photoDataUrl);
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: existing } = await supabase
    .from("bike_photos")
    .select("sort_order")
    .eq("bike_id", bikeId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const sortOrder = (existing?.[0]?.sort_order ?? -1) + 1;
  const path = `${bikeId}/${newId()}.jpg`;
  const blob = dataUrlToBlob(photoDataUrl);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  const { data: row, error } = await supabase
    .from("bike_photos")
    .insert({
      bike_id: bikeId,
      storage_path: path,
      sort_order: sortOrder,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapPhoto(row as DbPhoto);
}

export async function deletePhoto(
  bikeId: string,
  photoId: string
): Promise<boolean> {
  if (isDemoMode()) {
    return demoStore.deletePhoto(bikeId, photoId);
  }

  const supabase = createClient();
  const { data: photos } = await supabase
    .from("bike_photos")
    .select("id, storage_path")
    .eq("bike_id", bikeId);

  if (!photos || photos.length <= 1) return false;

  const target = photos.find((p) => p.id === photoId);
  if (!target) return false;

  await supabase.storage.from(BUCKET).remove([target.storage_path]);
  const { error } = await supabase.from("bike_photos").delete().eq("id", photoId);
  if (error) throw new Error(error.message);
  return true;
}

export async function deleteBike(bikeId: string): Promise<boolean> {
  if (isDemoMode()) {
    return demoStore.deleteBike(bikeId);
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: photos } = await supabase
    .from("bike_photos")
    .select("storage_path")
    .eq("bike_id", bikeId);

  const paths = (photos ?? [])
    .map((p) => p.storage_path)
    .filter((path) => path && !path.startsWith("http"));

  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove(paths);
    if (storageError) throw new Error(storageError.message);
  }

  const { error } = await supabase.from("bikes").delete().eq("id", bikeId);
  if (error) throw new Error(error.message);
  return true;
}

export async function markFbPosted(
  bikeId: string,
  staffEmail: string
): Promise<Bike | null> {
  return updateBike(
    bikeId,
    { last_fb_post_at: new Date().toISOString() },
    staffEmail
  );
}

export async function getStats(): Promise<DashboardStats> {
  if (isDemoMode()) {
    return demoStore.stats();
  }

  const bikes = await listBikes();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const soldThisMonth = bikes.filter(
    (b) =>
      b.status === "sold" &&
      b.sold_at &&
      new Date(b.sold_at) >= monthStart
  );

  const soldAll = bikes.filter((b) => b.status === "sold");
  const available = bikes.filter((b) => b.status === "available");

  const readyToPromote = bikes.filter(
    (b) =>
      b.status === "available" &&
      (b.photos?.length ?? 0) > 0 &&
      (!b.last_fb_post_at ||
        Date.now() - new Date(b.last_fb_post_at).getTime() > 7 * 86400000)
  ).length;

  return {
    available: available.length,
    refurb: bikes.filter((b) => b.status === "refurb").length,
    donated: bikes.filter((b) => b.status === "donated").length,
    reserved: bikes.filter((b) => b.status === "reserved").length,
    soldThisMonth: soldThisMonth.length,
    readyToPromote,
    adultAvailable: available.filter((b) => !isKidsBike(b.type)).length,
    kidsAvailable: available.filter((b) => isKidsBike(b.type)).length,
    totalInStock: bikes.filter(
      (b) => b.status !== "sold"
    ).length,
    soldAllTime: soldAll.length,
    revenueThisMonth: soldThisMonth.reduce(
      (sum, b) => sum + (b.sold_price ?? 0),
      0
    ),
    revenueAllTime: soldAll.reduce((sum, b) => sum + (b.sold_price ?? 0), 0),
  };
}
