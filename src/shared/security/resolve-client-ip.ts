/**
 * Local/dev fallback IP when no platform-provided `x-forwarded-for`
 * header is present. App Router Route Handlers on the Node.js runtime
 * have no reliable direct socket-address API (a genuine platform
 * limitation, not an oversight) — this constant stands in for "local
 * dev, CI e2e running against `next start`" per the security spec.
 */
const LOCAL_FALLBACK_IP = "127.0.0.1";

/**
 * Platform-conditional client IP resolution (security: Rate Limiting on
 * Write/Query Endpoints). Trusts the FIRST entry of `x-forwarded-for`
 * only because, in production, a platform-managed proxy (e.g. Vercel)
 * sanitizes/overwrites that header before the request reaches the app —
 * on generic append-style proxies the first entry is client-controlled
 * and MUST NOT be trusted as a general rule. Falls back to a fixed
 * local constant when the header is absent.
 */
export function resolveClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const [first] = forwardedFor.split(",");
    const trimmed = first?.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return LOCAL_FALLBACK_IP;
}
