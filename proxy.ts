import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import {
  isExcludedFromLocaleRouting,
  upgradeRedirectStatus,
} from "@/shared/i18n/middleware-rules";
import { routing } from "@/shared/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Locale routing Proxy (i18n: Locale Routing). Next.js 16 renamed the
 * `middleware` file convention to `proxy` (this file was `middleware.ts`
 * until PR2) — see `docs/adr` note in the PR2 apply findings. Thin
 * adapter over `next-intl`'s middleware — the actual routing decisions
 * (exclusion list, redirect status) live in the unit-tested
 * `shared/i18n/middleware-rules.ts`.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isExcludedFromLocaleRouting(pathname)) {
    return NextResponse.next();
  }

  const response = intlMiddleware(request);
  const targetStatus = upgradeRedirectStatus(response.status);

  if (targetStatus === response.status) {
    return response;
  }

  const location = response.headers.get("location");

  if (!location) {
    return response;
  }

  const upgraded = NextResponse.redirect(new URL(location), targetStatus);
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "location") {
      upgraded.headers.set(key, value);
    }
  });

  return upgraded;
}

export const config = {
  // Skip Next.js internals and favicon at the matcher level (a
  // performance optimization only) — the remaining exclusions
  // (/api/*, /sitemap.xml, /robots.txt, public/ assets, and the
  // /rss.xml exception) are handled precisely by
  // `isExcludedFromLocaleRouting` above.
  matcher: ["/((?!_next/|favicon.ico).*)"],
};
