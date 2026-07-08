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
    <nav
      aria-label={t("home")}
      className="flex items-center gap-[clamp(14px,2vw,30px)]"
    >
      {SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className="group relative py-1 text-[15px] font-medium text-ink transition-colors hover:text-coral"
        >
          {t(section.labelKey)}
          <span
            aria-hidden="true"
            className="absolute -bottom-0.5 left-0 h-0.5 w-full origin-left scale-x-0 bg-coral transition-transform duration-300 group-hover:scale-x-100"
          />
        </a>
      ))}
    </nav>
  );
}
