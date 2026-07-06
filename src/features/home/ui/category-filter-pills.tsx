"use client";

import { useTranslations } from "next-intl";

interface CategoryFilterPillsProps {
  /** Categories present in the current locale's published articles, in
   * canonical catalog order (article-filter: Category Filtering — the
   * pill set is the union of categories actually present; a category
   * with zero articles never gets a pill). */
  categories: string[];
  /** Selected category id, or `null` for "All". */
  active: string | null;
  onSelect: (category: string | null) => void;
}

/**
 * Functional category filter pills over the home articles list
 * (article-filter: Category Filtering, Reset Filter). Labels come from
 * the `blog.categories` catalog — reused rather than duplicated, since
 * category ids are shared, stable identifiers across the site.
 */
export function CategoryFilterPills({
  categories,
  active,
  onSelect,
}: CategoryFilterPillsProps) {
  const t = useTranslations("home.articles");
  const categoryLabels = useTranslations("blog.categories");

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t("heading")}>
      <FilterPill
        label={t("filterAll")}
        pressed={active === null}
        onClick={() => onSelect(null)}
      />
      {categories.map((category) => (
        <FilterPill
          key={category}
          label={categoryLabels(category)}
          pressed={active === category}
          onClick={() => onSelect(category)}
        />
      ))}
    </div>
  );
}

interface FilterPillProps {
  label: string;
  pressed: boolean;
  onClick: () => void;
}

function FilterPill({ label, pressed, onClick }: FilterPillProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={
        pressed
          ? "inline-flex rounded-full bg-coral px-3.5 py-1.5 text-sm font-medium text-coral-ink"
          : "inline-flex rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-coral hover:text-coral"
      }
    >
      {label}
    </button>
  );
}
