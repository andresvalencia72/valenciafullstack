import type { MetadataRoute } from "next";
import { buildArticleSitemapEntries } from "@/features/blog/application/build-article-sitemap-entries";
import { resolveAvailableArticleLocales } from "@/features/blog/application/resolve-available-locales";
import { createMdxArticleRepository } from "@/features/blog/infrastructure/mdx-article-repository";
import { publicEnv } from "@/shared/config/env.public";
import { mdxLoader } from "@/shared/content/mdx-loader";
import { locales } from "@/shared/i18n/routing";

// Composition root, same pattern as the blog article route (design.md:
// `app/*` MAY import feature `infrastructure` solely to instantiate
// repositories).
const repository = createMdxArticleRepository(mdxLoader);

/**
 * Non-article public routes that exist at every locale (home, privacy)
 * — unlike articles, these never have a "missing locale" case, so their
 * hreflang pairing is unconditional: both locales, `x-default` -> `es`.
 */
const STATIC_ROUTE_PATHS = ["", "/privacy"] as const;

function staticRouteEntries(): MetadataRoute.Sitemap {
  return STATIC_ROUTE_PATHS.map((path) => {
    const languages: Record<string, string> = {};
    for (const locale of locales) {
      languages[locale] = new URL(
        `/${locale}${path}`,
        publicEnv.NEXT_PUBLIC_SITE_URL,
      ).toString();
    }
    languages["x-default"] = languages.es;

    return {
      url: languages.es,
      alternates: { languages },
    };
  });
}

/**
 * Bilingual sitemap with hreflang alternates (seo: Bilingual Sitemap
 * with Hreflang; i18n: SEO Metadata Consistency). Article hreflang
 * pairing reuses `resolveAvailableArticleLocales` +
 * `buildArticleSitemapEntries` — the exact same building blocks the
 * article route's `generateMetadata` (task 4.5) uses, so the sitemap
 * and each article's own canonical/hreflang tags stay consistent by
 * construction rather than by convention (cross-ref 4.5).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = mdxLoader.getSlugs();
  const articleSources = await Promise.all(
    slugs.map(async (slug) => ({
      slug,
      availableLocales: await resolveAvailableArticleLocales(
        repository,
        slug,
        locales,
      ),
    })),
  );

  const articleEntries = buildArticleSitemapEntries(
    articleSources,
    publicEnv.NEXT_PUBLIC_SITE_URL,
  ).map((entry) => ({
    url: entry.url,
    alternates: entry.alternates,
  }));

  return [...staticRouteEntries(), ...articleEntries];
}
