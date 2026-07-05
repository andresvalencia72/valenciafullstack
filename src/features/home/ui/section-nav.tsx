"use client";

import { useTranslations } from "next-intl";

interface SectionNavItem {
  id: string;
  labelKey: "home" | "about" | "skills";
}

// Sections implemented to date (home-page: Section Composition — partial,
// PR3a). Growing with each later slice: PR3b adds projects/articles/
// contact, PR10 adds github activity — see home-page spec.
const SECTIONS: SectionNavItem[] = [
  { id: "home", labelKey: "home" },
  { id: "about", labelKey: "about" },
  { id: "skills", labelKey: "skills" },
];

/**
 * In-page anchor navigation (home-page: In-Page Navigation). Smooth
 * scrolling itself comes from the global `scroll-behavior: smooth` CSS
 * rule (app/globals.css) applied to plain `<a href="#section">` anchors —
 * no JS scroll orchestration needed, and the browser updates the URL
 * hash natively on click.
 */
export function SectionNav() {
  const t = useTranslations("home.nav");

  return (
    <nav aria-label={t("home")} className="flex items-center gap-6">
      {SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className="text-sm font-medium text-ink transition-colors hover:text-coral"
        >
          {t(section.labelKey)}
        </a>
      ))}
    </nav>
  );
}
