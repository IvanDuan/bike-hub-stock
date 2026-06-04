export async function requestListingDescription(
  bikeId: string,
  options?: { force?: boolean }
): Promise<string | null> {
  const res = await fetch("/api/ai/listing-description", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bikeId, force: options?.force ?? false }),
  });
  const data = (await res.json().catch(() => null)) as {
    description?: string;
    error?: string;
  } | null;
  if (!res.ok) return null;
  return data?.description?.trim() ?? null;
}
