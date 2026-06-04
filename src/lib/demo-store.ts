"use client";

import type { Bike, BikePhoto, DashboardStats, StaffSession } from "./types";
import type { BikeStatus, BikeType, BikeCategory } from "./constants";
import { isKidsBike, matchesCategory } from "./constants";
import { newId, safeStorage, storageErrorMessage } from "./safe-storage";

const STORAGE_KEY = "bike-hub-stock-data-v2";
const SESSION_KEY = "bike-hub-stock-session";

interface DemoData {
  bikes: Bike[];
  photos: BikePhoto[];
  tags: string[];
}

const DEMO_STAFF: StaffSession[] = [
  { email: "alex@bikehub.demo", name: "Alex" },
  { email: "sam@bikehub.demo", name: "Sam" },
  { email: "demo@bikehub.local", name: "Demo Staff" },
];

function now() {
  return new Date().toISOString();
}

function id() {
  return newId();
}

function seedData(): DemoData {
  const bike1Id = id();
  const bike2Id = id();
  const bike3Id = id();
  const bike4Id = id();
  const daysAgo = (n: number) =>
    new Date(Date.now() - n * 86400000).toISOString();

  return {
    bikes: [
      {
        id: bike1Id,
        status: "available",
        make: "Trek",
        model: "FX 2",
        type: "hybrid",
        frame_size: "M",
        color: "Blue",
        condition_notes: "New tires, tuned gears",
        listing_description:
          "Smooth commuter hybrid — recently refurbished with new tires and a full tune.",
        asking_price: 250,
        sold_price: null,
        price_negotiable: true,
        donated_at: daysAgo(14),
        listed_at: daysAgo(3),
        sold_at: null,
        last_fb_post_at: null,
        created_at: daysAgo(14),
        updated_at: daysAgo(3),
        created_by: "demo@bikehub.local",
        updated_by: "demo@bikehub.local",
      },
      {
        id: bike2Id,
        status: "refurb",
        make: "Giant",
        model: "Escape",
        type: "hybrid",
        frame_size: "L",
        color: "Black",
        condition_notes: "Needs brake pads",
        listing_description: "",
        asking_price: null,
        sold_price: null,
        price_negotiable: true,
        donated_at: daysAgo(7),
        listed_at: null,
        sold_at: null,
        last_fb_post_at: null,
        created_at: daysAgo(7),
        updated_at: daysAgo(2),
        created_by: "alex@bikehub.demo",
        updated_by: "alex@bikehub.demo",
      },
      {
        id: bike3Id,
        status: "sold",
        make: "Avanti",
        model: "Metro",
        type: "road",
        frame_size: "S",
        color: "Red",
        condition_notes: "",
        listing_description: "Light road bike, great for fitness rides.",
        asking_price: 180,
        sold_price: 160,
        price_negotiable: true,
        donated_at: daysAgo(30),
        listed_at: daysAgo(20),
        sold_at: daysAgo(5),
        last_fb_post_at: daysAgo(18),
        created_at: daysAgo(30),
        updated_at: daysAgo(5),
        created_by: "sam@bikehub.demo",
        updated_by: "sam@bikehub.demo",
      },
      {
        id: bike4Id,
        status: "donated",
        make: "Apollo",
        model: "Neo",
        type: "kids",
        frame_size: "20\"",
        color: "Purple",
        condition_notes: "Light rust on chain, otherwise good",
        listing_description: "",
        asking_price: null,
        sold_price: null,
        price_negotiable: true,
        donated_at: daysAgo(1),
        listed_at: null,
        sold_at: null,
        last_fb_post_at: null,
        created_at: daysAgo(1),
        updated_at: daysAgo(1),
        created_by: "demo@bikehub.local",
        updated_by: "demo@bikehub.local",
      },
    ],
    photos: [
      {
        id: id(),
        bike_id: bike1Id,
        url: "/demo/trek-hybrid.jpg",
        sort_order: 0,
        uploaded_at: daysAgo(3),
      },
      {
        id: id(),
        bike_id: bike2Id,
        url: "/demo/giant-hybrid.jpg",
        sort_order: 0,
        uploaded_at: daysAgo(2),
      },
      {
        id: id(),
        bike_id: bike3Id,
        url: "/demo/avanti-road.jpg",
        sort_order: 0,
        uploaded_at: daysAgo(20),
      },
      {
        id: id(),
        bike_id: bike4Id,
        url: "/demo/kids-bike.jpg",
        sort_order: 0,
        uploaded_at: daysAgo(1),
      },
    ],
    tags: ["new tires", "lightweight", "comfortable", "great commuter", "kids bike"],
  };
}

function read(): DemoData {
  if (typeof window === "undefined") return seedData();
  const raw = safeStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedData();
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  return JSON.parse(raw) as DemoData;
}

function write(data: DemoData) {
  try {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    throw new Error(storageErrorMessage(error));
  }
}

function attachPhotos(bikes: Bike[], photos: BikePhoto[]): Bike[] {
  return bikes.map((bike) => ({
    ...bike,
    photos: photos
      .filter((p) => p.bike_id === bike.id)
      .sort((a, b) => a.sort_order - b.sort_order),
  }));
}

export const demoStore = {
  login(email: string, _password: string): StaffSession | null {
    if (!email.includes("@")) return null;
    const staff =
      DEMO_STAFF.find((s) => s.email === email) ?? {
        email,
        name: email.split("@")[0],
      };
    safeStorage.setItem(SESSION_KEY, JSON.stringify(staff));
    return staff;
  },

  logout() {
    safeStorage.removeItem(SESSION_KEY);
  },

  session(): StaffSession | null {
    if (typeof window === "undefined") return null;
    const raw = safeStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StaffSession) : null;
  },

  listBikes(filters?: {
    status?: BikeStatus | BikeStatus[];
    search?: string;
    category?: BikeCategory;
  }): Bike[] {
    const data = read();
    let bikes = attachPhotos([...data.bikes], data.photos);

    if (filters?.category && filters.category !== "all") {
      bikes = bikes.filter((b) => matchesCategory(b.type, filters.category!));
    }

    if (filters?.status) {
      const statuses = Array.isArray(filters.status)
        ? filters.status
        : [filters.status];
      bikes = bikes.filter((b) => statuses.includes(b.status));
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

    return bikes.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  },

  getBike(bikeId: string): Bike | null {
    const data = read();
    const bike = data.bikes.find((b) => b.id === bikeId);
    if (!bike) return null;
    return attachPhotos([bike], data.photos)[0];
  },

  createBike(
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
  ): Bike {
    const data = read();
    const bikeId = id();
    const timestamp = now();

    const bike: Bike = {
      id: bikeId,
      status: "donated",
      make: input.make ?? "",
      model: input.model ?? "",
      type: input.type ?? "other",
      frame_size: input.frame_size ?? "",
      color: input.color ?? "",
      condition_notes: input.condition_notes ?? "",
      listing_description: "",
      selling_tags: input.selling_tags ?? [],
      asking_price: null,
      sold_price: null,
      price_negotiable: true,
      donated_at: timestamp,
      listed_at: null,
      sold_at: null,
      last_fb_post_at: null,
      created_at: timestamp,
      updated_at: timestamp,
      created_by: staffEmail,
      updated_by: staffEmail,
    };

    data.bikes.push(bike);

    if (input.selling_tags && input.selling_tags.length > 0) {
      const existing = new Set(data.tags.map((t) => t.toLowerCase()));
      input.selling_tags
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((t) => {
          if (!existing.has(t.toLowerCase())) data.tags.push(t);
        });
    }

    if (input.photoDataUrl) {
      data.photos.push({
        id: id(),
        bike_id: bikeId,
        url: input.photoDataUrl,
        sort_order: 0,
        uploaded_at: timestamp,
      });
    }

    write(data);
    return this.getBike(bikeId)!;
  },

  listTags(): string[] {
    const data = read();
    return [...data.tags].sort((a, b) => a.localeCompare(b));
  },

  updateBike(
    bikeId: string,
    patch: Partial<Bike>,
    staffEmail: string
  ): Bike | null {
    const data = read();
    const index = data.bikes.findIndex((b) => b.id === bikeId);
    if (index === -1) return null;

    data.bikes[index] = {
      ...data.bikes[index],
      ...patch,
      updated_at: now(),
      updated_by: staffEmail,
    };
    write(data);
    return this.getBike(bikeId);
  },

  addPhoto(bikeId: string, photoDataUrl: string): BikePhoto | null {
    const data = read();
    if (!data.bikes.some((b) => b.id === bikeId)) return null;
    const existing = data.photos.filter((p) => p.bike_id === bikeId);
    const photo: BikePhoto = {
      id: id(),
      bike_id: bikeId,
      url: photoDataUrl,
      sort_order: existing.length,
      uploaded_at: now(),
    };
    data.photos.push(photo);
    write(data);
    return photo;
  },

  deletePhoto(bikeId: string, photoId: string): boolean {
    const data = read();
    const bikePhotos = data.photos.filter((p) => p.bike_id === bikeId);
    if (bikePhotos.length <= 1) return false;
    if (!bikePhotos.some((p) => p.id === photoId)) return false;

    data.photos = data.photos.filter((p) => p.id !== photoId);
    write(data);
    return true;
  },

  deleteBike(bikeId: string): boolean {
    const data = read();
    const index = data.bikes.findIndex((b) => b.id === bikeId);
    if (index === -1) return false;

    data.bikes.splice(index, 1);
    data.photos = data.photos.filter((p) => p.bike_id !== bikeId);
    write(data);
    return true;
  },

  markFbPosted(bikeId: string, staffEmail: string) {
    return this.updateBike(
      bikeId,
      { last_fb_post_at: now() },
      staffEmail
    );
  },

  stats(): DashboardStats {
    const bikes = this.listBikes();
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

    const readyToPromote = bikes.filter(
      (b) =>
        b.status === "available" &&
        (b.photos?.length ?? 0) > 0 &&
        (!b.last_fb_post_at ||
          Date.now() - new Date(b.last_fb_post_at).getTime() > 7 * 86400000)
    ).length;

    const available = bikes.filter((b) => b.status === "available");

    return {
      available: available.length,
      refurb: bikes.filter((b) => b.status === "refurb").length,
      donated: bikes.filter((b) => b.status === "donated").length,
      reserved: bikes.filter((b) => b.status === "reserved").length,
      soldThisMonth: soldThisMonth.length,
      readyToPromote,
      adultAvailable: available.filter((b) => !isKidsBike(b.type)).length,
      kidsAvailable: available.filter((b) => isKidsBike(b.type)).length,
      totalInStock: bikes.filter((b) => b.status !== "sold").length,
      soldAllTime: soldAll.length,
      revenueThisMonth: soldThisMonth.reduce((sum, b) => sum + (b.sold_price ?? 0), 0),
      revenueAllTime: soldAll.reduce((sum, b) => sum + (b.sold_price ?? 0), 0),
    };
  },
};
