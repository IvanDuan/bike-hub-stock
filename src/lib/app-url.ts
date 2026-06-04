/** Base URL of this app (no trailing slash). Used for invite/callback links. */
export function getAppUrl(request?: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;

  if (request) {
    const origin = request.headers.get("origin")?.trim().replace(/\/$/, "");
    if (origin) return origin;
    try {
      return new URL(request.url).origin;
    } catch {
      // ignore
    }
  }

  return "http://localhost:3001";
}
