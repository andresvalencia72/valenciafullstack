import type { ArticleLocale } from "../domain/article-repository";

const LOCALE_TAGS: Record<ArticleLocale, string> = {
  es: "es-ES",
  en: "en-US",
};

/**
 * Formats an ISO article date (`YYYY-MM-DD`) as a short, locale-aware
 * date string (e.g. "14 jun 2026" / "Jun 14, 2026"), matching
 * design-reference's article meta line. `timeZone: "UTC"` avoids the
 * date shifting a day depending on the server/CI machine's local zone.
 */
export function formatArticleDate(
  isoDate: string,
  locale: ArticleLocale,
): string {
  const date = new Date(`${isoDate}T00:00:00Z`);

  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
