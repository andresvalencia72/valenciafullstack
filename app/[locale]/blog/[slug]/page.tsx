import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getArticle } from "@/features/blog/application/get-article";
import { getNextArticle } from "@/features/blog/application/get-next-article";
import { resolveArticleSeoAlternates } from "@/features/blog/application/resolve-article-seo-alternates";
import type { ArticleLocale } from "@/features/blog/domain/article-repository";
import { createMdxArticleRepository } from "@/features/blog/infrastructure/mdx-article-repository";
import { ArticlePage } from "@/features/blog/ui/article-page";
import { EngagementPanel } from "@/features/engagement/ui/engagement-panel";
import { publicEnv } from "@/shared/config/env.public";
import { mdxLoader } from "@/shared/content/mdx-loader";
import { locales } from "@/shared/i18n/routing";

// Composition root: this is the one place allowed to instantiate the
// `blog` feature's infrastructure and wire it into its application use
// cases (design.md: `app/*` MAY import feature `infrastructure` solely
// to instantiate repositories).
const repository = createMdxArticleRepository(mdxLoader);

interface ArticleRouteParams {
  locale: string;
  slug: string;
}

interface ArticleRouteProps {
  params: Promise<ArticleRouteParams>;
}

/**
 * Statically generates every known slug for both locales, and — as a
 * side effect of iterating the whole content tree once at build time —
 * validates it (blog: Frontmatter Validation, Cross-Locale Frontmatter
 * Consistency, Reserved slug rejected, Category id with no catalog
 * label fails the build). Invalid content throws `ContentValidationError`
 * here, which fails `next build`.
 */
export function generateStaticParams() {
  mdxLoader.validateContentTree();

  const slugs = mdxLoader.getSlugs();
  return locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug })),
  );
}

async function resolveAvailableLocales(
  slug: string,
): Promise<ArticleLocale[]> {
  const checks = await Promise.all(
    locales.map(async (locale) => ({
      locale,
      exists: (await repository.findArticle(slug, locale)) !== null,
    })),
  );

  return checks.filter((entry) => entry.exists).map((entry) => entry.locale);
}

function articleUrl(locale: ArticleLocale, slug: string): string {
  return new URL(
    `/${locale}/blog/${slug}`,
    publicEnv.NEXT_PUBLIC_SITE_URL,
  ).toString();
}

/**
 * Canonical + hreflang metadata per route (seo: Bilingual Sitemap with
 * Hreflang; i18n: SEO Metadata Consistency) — cross-ref task 9.3.
 */
export async function generateMetadata({
  params,
}: ArticleRouteProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const requestedLocale = locale as ArticleLocale;
  const result = await getArticle(repository, slug, requestedLocale);

  if (result.kind === "not-found") {
    return {};
  }

  const availableLocales = await resolveAvailableLocales(slug);
  const { canonicalLocale, hreflangLocales, xDefaultLocale } =
    resolveArticleSeoAlternates(requestedLocale, availableLocales);

  const languages: Record<string, string> = {};
  for (const availableLocale of hreflangLocales) {
    languages[availableLocale] = articleUrl(availableLocale, slug);
  }
  languages["x-default"] = articleUrl(xDefaultLocale, slug);

  return {
    title: result.article.title,
    description: result.article.description,
    alternates: {
      canonical: articleUrl(canonicalLocale, slug),
      languages,
    },
  };
}

export default async function ArticleRoutePage({ params }: ArticleRouteProps) {
  const { locale, slug } = await params;
  const requestedLocale = locale as ArticleLocale;
  setRequestLocale(requestedLocale);

  const result = await getArticle(repository, slug, requestedLocale);

  if (result.kind === "not-found") {
    notFound();
  }

  const nextArticle = await getNextArticle(
    repository,
    slug,
    result.article.locale,
  );

  return (
    <ArticlePage result={result} nextArticle={nextArticle}>
      <EngagementPanel slug={slug} />
    </ArticlePage>
  );
}
