import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getArticle } from "@/features/blog/application/get-article";
import type { ArticleLocale } from "@/features/blog/domain/article-repository";
import { createMdxArticleRepository } from "@/features/blog/infrastructure/mdx-article-repository";
import { mdxLoader } from "@/shared/content/mdx-loader";
import { locales } from "@/shared/i18n/routing";

// Composition root, same pattern as `page.tsx` in this route segment
// (design.md: `app/*` MAY import feature `infrastructure` solely to
// instantiate repositories). A separate instance is intentional — each
// convention route file (`page.tsx`, `opengraph-image.tsx`) wires its
// own thin composition root rather than sharing a cross-file singleton.
const repository = createMdxArticleRepository(mdxLoader);

export const alt = "Article cover image";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface OgImageRouteParams {
  locale: string;
  slug: string;
}

/** Statically generates every known (locale, slug) pair, mirroring `page.tsx`. */
export function generateStaticParams() {
  const slugs = mdxLoader.getSlugs();
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

/**
 * Per-article, per-locale Open Graph image (seo: Dynamic OG Images).
 * Reuses `getArticle`'s existing fallback resolution — when the
 * requested locale has no MDX file, `getArticle` already returns the
 * other locale's content (`kind: "fallback"`), so the image renders
 * that content locale's title, satisfying "missing-translation fallback
 * serves the content locale's image" without any extra branching here.
 */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<OgImageRouteParams>;
}) {
  const { locale, slug } = await params;
  const requestedLocale = locale as ArticleLocale;
  const result = await getArticle(repository, slug, requestedLocale);

  if (result.kind === "not-found") {
    notFound();
  }

  const { article } = result;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          backgroundColor: "#161310",
          color: "#EFEBE3",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#FF5A2C",
          }}
        >
          {article.category}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.15,
          }}
        >
          {article.title}
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#EFEBE3" }}>
          valenciafullstack.tech
        </div>
      </div>
    ),
    { ...size },
  );
}
