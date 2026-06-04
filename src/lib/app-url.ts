function isLocalHost(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

/** Base URL of this app (no trailing slash). Used for invite/callback links. */
export function getAppUrl(request?: Request): string {
  // Vercel production (ignore NEXT_PUBLIC_APP_URL if it still points at localhost)
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProduction) {
    const host = vercelProduction.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }

  if (process.env.VERCEL === "1") {
    const vercelUrl = process.env.VERCEL_URL?.trim();
    if (vercelUrl) {
      const host = vercelUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
      return `https://${host}`;
    }
  }

  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configured && !isLocalHost(configured)) return configured;

  if (request) {
    const origin = request.headers.get("origin")?.trim().replace(/\/$/, "");
    if (origin && !isLocalHost(origin)) return origin;
    try {
      const originFromUrl = new URL(request.url).origin;
      if (!isLocalHost(originFromUrl)) return originFromUrl;
    } catch {
      // ignore
    }
  }

  if (configured) return configured;

  return "http://localhost:3001";
}
