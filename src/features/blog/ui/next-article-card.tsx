import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/navigation";
import type { ArticleLocale } from "../domain/article-repository";

interface NextArticleCardProps {
  slug: string;
  locale: ArticleLocale;
  title: string;
  category: string;
  readingTimeMinutes: number;
}

/**
 * "Next article" teaser card (design-reference: band below the article
 * body). `locale` is the next article's own content locale (it may
 * differ from the current page's locale when that article only has a
 * translation in one locale — same fallback rule as the current
 * article).
 */
export function NextArticleCard({
  slug,
  locale,
  title,
  category,
  readingTimeMinutes,
}: NextArticleCardProps) {
  const t = useTranslations("blog");
  const categoryLabel = useTranslations("blog.categories")(category);

  return (
    <div>
      <span className="font-mono text-xs tracking-widest text-ink-faint uppercase">
        {t("nextArticle")}
      </span>
      <Link
        href={`/blog/${slug}`}
        locale={locale}
        className="mt-4 flex items-center justify-between gap-5 rounded-2xl border border-line bg-card p-6 no-underline transition-[border-color,transform] hover:border-coral hover:-translate-y-0.5"
      >
        <div>
          <div className="mb-2 font-mono text-xs tracking-wide text-coral uppercase">
            {categoryLabel} · {readingTimeMinutes} min
          </div>
          <h3 className="m-0 font-display text-2xl leading-tight font-semibold tracking-tight">
            {title}
          </h3>
        </div>
        <span
          aria-hidden
          className="grid h-11.5 w-11.5 flex-shrink-0 place-items-center rounded-full border border-line"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </span>
      </Link>
    </div>
  );
}
