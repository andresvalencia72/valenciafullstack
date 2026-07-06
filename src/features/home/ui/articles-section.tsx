"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/navigation";
import { Reveal } from "@/shared/ui/motion/reveal";
import { Tilt } from "@/shared/ui/motion/tilt";
import { ARTICLE_CATEGORY_IDS } from "@/shared/content/categories";
import type { HomeArticleSummary } from "../domain/article-summary";
import { CategoryFilterPills } from "./category-filter-pills";

interface ArticlesSectionProps {
  /** Latest-first, locale-filtered article summaries (home-page:
   * Embedded Article List), provided by the `app/` composition root via
   * `shared/content` — `home` never imports the `blog` feature
   * directly. */
  articles: HomeArticleSummary[];
}

/**
 * Embedded articles list with a functional category filter (home-page:
 * Embedded Article List; article-filter: Category Filtering, Reset
 * Filter, Empty Result Handling). The search input (home-page spec:
 * "ships in PR8") is intentionally not built here.
 */
export function ArticlesSection({ articles }: ArticlesSectionProps) {
  const t = useTranslations("home.articles");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const availableCategories = useMemo(
    () =>
      ARTICLE_CATEGORY_IDS.filter((category) =>
        articles.some((article) => article.category === category),
      ),
    [articles],
  );

  const visibleArticles = useMemo(
    () =>
      activeCategory === null
        ? articles
        : articles.filter((article) => article.category === activeCategory),
    [articles, activeCategory],
  );

  return (
    <section
      id="articles"
      className="bg-band px-4 py-20 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
            <h2 className="font-display text-4xl leading-none font-semibold tracking-tight lg:text-7xl">
              {t("heading")}.
            </h2>
            {availableCategories.length > 0 && (
              <CategoryFilterPills
                categories={availableCategories}
                active={activeCategory}
                onSelect={setActiveCategory}
              />
            )}
          </div>
        </Reveal>

        <div className="grid gap-4.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <div className="flex flex-col gap-3.5">
            {visibleArticles.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-ink-soft">
                {t("empty")}
              </p>
            ) : (
              visibleArticles.map((article) => (
                <ArticleRow key={article.slug} article={article} />
              ))
            )}
          </div>

          <YouTubeCallout />
        </div>
      </div>
    </section>
  );
}

function ArticleRow({ article }: { article: HomeArticleSummary }) {
  const categoryLabel = useTranslations("blog.categories")(article.category);
  const readingTime = useTranslations("blog")("readingTime", {
    minutes: article.readingTimeMinutes,
  });

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="flex items-center gap-4.5 rounded-2xl border border-line bg-card p-4.5 no-underline transition-[border-color,transform] hover:translate-x-1 hover:border-coral"
    >
      <div
        aria-hidden
        className="h-18 w-23 flex-shrink-0 rounded-lg bg-bg"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, transparent 0 11px, color-mix(in srgb, var(--ink) 7%, transparent) 11px 12px)",
        }}
      />
      <div className="min-w-0">
        <div className="mb-1.5 flex gap-2.5 font-mono text-xs tracking-wide text-coral uppercase">
          {categoryLabel} · {readingTime}
        </div>
        <h3 className="m-0 font-display text-lg leading-tight font-semibold tracking-tight text-ink">
          {article.title}
        </h3>
      </div>
    </Link>
  );
}

function YouTubeCallout() {
  const t = useTranslations("home.articles.youtube");

  return (
    <Reveal>
      <Tilt>
        <a
          href="https://www.youtube.com/@codeink1"
          target="_blank"
          rel="noopener"
          className="flex h-full min-h-60 flex-col justify-between gap-6 rounded-2xl bg-ink p-7 text-bg no-underline"
        >
          <div className="flex items-center gap-2.5 font-mono text-xs tracking-widest text-bg/70 uppercase">
            <span className="text-coral">▶</span> {t("eyebrow")}
          </div>
          <div>
            <h3 className="mb-2.5 font-display text-3xl leading-tight font-bold tracking-tight">
              {t("title")}
            </h3>
            <p className="max-w-xs text-sm leading-snug text-bg/70">
              {t("description")}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-coral px-4.5 py-2.5 text-sm font-semibold text-coral-ink">
            {t("cta")}
          </span>
        </a>
      </Tilt>
    </Reveal>
  );
}
