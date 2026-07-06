import { useTranslations } from "next-intl";
import type { ArticleLocale } from "../domain/article-repository";

interface FallbackNoticeProps {
  /** The locale whose content is actually being shown. */
  contentLocale: ArticleLocale;
}

/**
 * Visible notice shown when an article is rendered in the fallback
 * locale because no translation exists for the requested one (blog:
 * Missing-Translation Fallback — "MUST display a visible notice").
 * `role="status"` announces it to assistive tech without stealing
 * focus.
 */
export function FallbackNotice({ contentLocale }: FallbackNoticeProps) {
  const t = useTranslations("blog");

  return (
    <p
      role="status"
      className="rounded-lg border border-line bg-card px-4 py-3 text-sm text-ink-soft"
    >
      {t("fallbackNotice", { language: t(`languageNames.${contentLocale}`) })}
    </p>
  );
}
