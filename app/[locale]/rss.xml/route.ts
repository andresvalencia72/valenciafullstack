import { NextResponse } from "next/server";
import { buildRssFeed } from "@/shared/content/build-rss-feed";
import { listPublishedArticles } from "@/shared/content/list-published-articles";
import { mdxLoader } from "@/shared/content/mdx-loader";
import { publicEnv } from "@/shared/config/env.public";
import { hasLocale } from "next-intl";
import { locales } from "@/shared/i18n/routing";

interface RssRouteParams {
  locale: string;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * Thin composition-root adapter (design.md API Surface pattern) — the
 * per-locale filtering (`listPublishedArticles`) and all XML
 * construction/escaping (`buildRssFeed`) live in the coverage-gated
 * `src/**` tree; this handler only wires the locale param and sets
 * response headers.
 *
 * `/rss.xml/route.ts` sits directly under the `[locale]` segment, which
 * is NOT wrapped by `app/[locale]/layout.tsx` (layouts only apply to
 * the page tree, not sibling Route Handlers) — so the `hasLocale` guard
 * that `layout.tsx` normally provides for page requests must be
 * re-applied here explicitly (i18n: unknown locale segments, e.g.
 * `/fr/rss.xml`, MUST return 404).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<RssRouteParams> },
): Promise<NextResponse> {
  const { locale } = await params;

  if (!hasLocale(locales, locale)) {
    return new NextResponse(null, { status: 404 });
  }

  const articles = listPublishedArticles(mdxLoader, locale);
  const xml = buildRssFeed({
    articles,
    locale,
    siteUrl: publicEnv.NEXT_PUBLIC_SITE_URL,
  });

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
