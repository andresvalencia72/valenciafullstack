import { useTranslations } from "next-intl";

interface CategoryBadgeProps {
  /**
   * Stable category id (e.g. "architecture"). Typed as `string` rather
   * than `ArticleCategoryId` because the domain `Article` entity keeps
   * `category` generic (domain must not import `shared/content`); the
   * content pipeline's build-time validation guarantees this is always
   * a known id by the time it reaches the UI.
   */
  category: string;
}

/**
 * Category pill badge (design-reference: article header eyebrow badge).
 * Renders the category's i18n label, never the raw stable id.
 */
export function CategoryBadge({ category }: CategoryBadgeProps) {
  const t = useTranslations("blog.categories");

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-coral px-3.5 py-1.5 font-mono text-xs tracking-widest text-coral-ink uppercase">
      {t(category)}
    </span>
  );
}
