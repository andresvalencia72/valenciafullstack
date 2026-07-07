"use client";

import { useTranslations } from "next-intl";

interface SectionNavItem {
  id: string;
  labelKey:
    | "home"
    | "about"
    | "skills"
    | "projects"
    | "articles"
    | "githubActivity"
    | "contact";
}

// Full nine-section set (home-page: Section Composition — PR3a + PR3b +
// PR10's github activity, between articles and contact).
const SECTIONS: SectionNavItem[] = [
  { id: "home", labelKey: "home" },
  { id: "about", labelKey: "about" },
  { id: "skills", labelKey: "skills" },
  { id: "projects", labelKey: "projects" },
  { id: "articles", labelKey: "articles" },
  { id: "github-activity", labelKey: "githubActivity" },
  { id: "contact", labelKey: "contact" },
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
