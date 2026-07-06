import { useTranslations } from "next-intl";

/**
 * Author byline (design-reference: monogram avatar + name + role),
 * shown under the article title. Single-author site — no per-article
 * author frontmatter field.
 */
export function AuthorByline() {
  const t = useTranslations("blog");

  return (
    <div className="flex items-center gap-3.5 border-b border-line pb-7">
      <span
        aria-hidden
        className="grid h-11.5 w-11.5 place-items-center rounded-full bg-ink font-display text-xl font-bold text-bg"
      >
        A
      </span>
      <div>
        <div className="text-sm font-semibold">{t("authorName")}</div>
        <div className="text-xs text-ink-faint">{t("authorRole")}</div>
      </div>
    </div>
  );
}
