const EXACT_EXCLUDED_PATHS = new Set(["/sitemap.xml", "/robots.txt", "/favicon.ico"]);
const EXCLUDED_PREFIXES = ["/api/", "/_next/"];

/**
 * Whether a request path MUST be served directly, without any locale
 * prefixing or redirect (i18n: Locale Routing). Covers `/api/*`,
 * `/sitemap.xml`, `/robots.txt`, `/_next/*`, `/favicon.ico`, and static
 * assets served from `public/` (any remaining path whose last segment
 * has a file extension).
 *
 * `/rss.xml` is a deliberate, explicit exception: it MUST still flow
 * through normal locale routing so it 308-redirects to `/es/rss.xml`
 * (feed readers commonly probe the unprefixed path).
 */
export function isExcludedFromLocaleRouting(pathname: string): boolean {
  if (pathname === "/rss.xml") {
    return false;
  }

  if (EXACT_EXCLUDED_PATHS.has(pathname)) {
    return true;
  }

  if (EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  const lastSegment = pathname.split("/").pop() ?? "";
  return lastSegment.includes(".");
}

/**
 * Upgrades a temporary (307) redirect status to permanent (308).
 *
 * next-intl's middleware calls `NextResponse.redirect(url)` without an
 * explicit status, which Next.js defaults to 307. Per i18n: Locale
 * Routing, the unprefixed-to-`es` redirect MUST be a 308 — this
 * corrects that at the middleware boundary rather than depending on an
 * upstream library default (verified against next-intl's middleware
 * source and Next's `NextResponse.redirect` default during PR2).
 */
export function upgradeRedirectStatus(status: number): number {
  return status === 307 ? 308 : status;
}
