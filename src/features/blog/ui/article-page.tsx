import { LocaleSwitcher } from "@/shared/i18n/ui/locale-switcher";
import { ThemeToggle } from "@/shared/ui/theme/theme-toggle";
import type { GetArticleResult } from "../application/get-article";
import type { ArticleTeaser } from "../application/get-next-article";
import { ArticleBody } from "./article-body";
import { ArticleCover } from "./article-cover";
import { ArticleHeader } from "./article-header";
import { BackToPortfolioLink } from "./back-to-portfolio-link";
import { FallbackNotice } from "./fallback-notice";
import { NextArticleCard } from "./next-article-card";
import { TagPills } from "./tag-pills";

interface ArticlePageProps {
  /** Result from the `getArticle` use case; MUST NOT be `kind: "not-found"` — the caller (`app/[locale]/blog/[slug]/page.tsx`) handles that with `notFound()` before rendering this component. */
  result: Exclude<GetArticleResult, { kind: "not-found" }>;
  nextArticle: ArticleTeaser | null;
}

/**
 * Article page composition root (blog: MDX Article Rendering). A thin
 * `app/` route (`app/[locale]/blog/[slug]/page.tsx`) resolves the
 * article via the `getArticle`/`getNextArticle` use cases and passes
 * the result here — this component only renders, it never touches the
 * repository or filesystem directly (design.md: `app/` routes are
 * composition roots, `ui` never imports `infrastructure`).
 */
export async function ArticlePage({ result, nextArticle }: ArticlePageProps) {
  const { article } = result;
  const body = await ArticleBody({ source: article.content });

  return (
    <main className="mx-auto max-w-3xl px-4 pt-28 pb-10 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <BackToPortfolioLink />
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <article>
        <ArticleHeader
          title={article.title}
          category={article.category}
          date={article.date}
          locale={article.locale}
          readingTimeMinutes={article.readingTimeMinutes}
        />

        {result.kind === "fallback" && (
          <div className="mt-6">
            <FallbackNotice contentLocale={result.contentLocale} />
          </div>
        )}

        <ArticleCover />

        {body}

        <div className="mt-11 border-t border-line pt-7">
          <TagPills tags={article.tags} />
        </div>
      </article>

      {nextArticle && (
        <div className="mt-11 border-t border-line pt-9">
          <NextArticleCard
            slug={nextArticle.slug}
            locale={nextArticle.locale}
            title={nextArticle.title}
            category={nextArticle.category}
            readingTimeMinutes={nextArticle.readingTimeMinutes}
          />
        </div>
      )}
    </main>
  );
}
