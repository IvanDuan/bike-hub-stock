"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getBike as fetchBike,
  getStats as fetchStats,
  listBikes,
  type BikeFilters,
} from "@/lib/bikes-api";
import type { Bike, DashboardStats } from "@/lib/types";

function stableFilters(filters?: BikeFilters): BikeFilters {
  return {
    status: filters?.status,
    search: filters?.search || undefined,
    category: filters?.category ?? "all",
  };
}

export function useBikes(filters?: BikeFilters) {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => stableFilters(filters), [
    Array.isArray(filters?.status) ? filters.status.join(",") : filters?.status,
    filters?.search,
    filters?.category,
  ]);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    setError(null);
    try {
      setBikes(await listBikes(query));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bikes");
      setBikes([]);
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => load({ silent: true }), [load]);

  return { bikes, loading, error, refresh };
}

export function useBike(id: string) {
  const [bike, setBike] = useState<Bike | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBike(await fetchBike(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bike");
      setBike(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { bike, loading, error, refresh: load };
}

export function useStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      setStats(await fetchStats());
    } catch {
      setStats(null);
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => load({ silent: true }), [load]);

  return { stats, loading, refresh };
}
