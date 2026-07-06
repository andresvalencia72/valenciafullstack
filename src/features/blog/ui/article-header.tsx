import { useTranslations } from "next-intl";
import type { ArticleLocale } from "../domain/article-repository";
import { AuthorByline } from "./author-byline";
import { CategoryBadge } from "./category-badge";
import { formatArticleDate } from "./format-article-date";
import { splitTitleHighlight } from "./split-title-highlight";

interface ArticleHeaderProps {
  title: string;
  category: string;
  date: string;
  locale: ArticleLocale;
  readingTimeMinutes: number;
}

/**
 * Article header: category badge + date/reading-time meta line +
 * highlighted title + author byline (design-reference: article header
 * block).
 */
export function ArticleHeader({
  title,
  category,
  date,
  locale,
  readingTimeMinutes,
}: ArticleHeaderProps) {
  const t = useTranslations("blog");
  const { leading, highlighted } = splitTitleHighlight(title);

  return (
    <header>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <CategoryBadge category={category} />
        <span className="font-mono text-xs tracking-wide text-ink-faint uppercase">
          {formatArticleDate(date, locale)} ·{" "}
          {t("readingTime", { minutes: readingTimeMinutes })}
        </span>
      </div>

      <h1 className="mb-6.5 font-display text-5xl leading-[1.02] font-bold tracking-tight lg:text-6xl">
        {leading ? `${leading} ` : ""}
        <span className="relative rounded-[3px] bg-salmon px-1">
          {highlighted}
        </span>
      </h1>

      <AuthorByline />
    </header>
  );
}
