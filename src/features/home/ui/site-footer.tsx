import { useTranslations } from "next-intl";

const FOOTER_LINKS = [
  { href: "#about", labelKey: "about" as const },
  { href: "#projects", labelKey: "projects" as const },
  { href: "#articles", labelKey: "articles" as const },
];

/**
 * Site footer: brand monogram, copyright line, section anchor links, and
 * a back-to-top link (home-page: Section Composition — footer). The
 * copyright year is computed at render time rather than hardcoded.
 */
export function SiteFooter() {
  const tNav = useTranslations("home.nav");
  const tFooter = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line px-4 py-9 lg:px-8 lg:py-14">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid h-7.5 w-7.5 place-items-center rounded-full bg-ink font-display text-base font-bold text-bg"
          >
            A
          </span>
          <span className="text-sm text-ink-soft">
            © {year} <strong className="font-semibold text-ink">Andrés Valencia</strong> ·{" "}
            {tFooter("tagline")}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-5.5">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-ink-soft transition-colors hover:text-coral"
            >
              {tNav(link.labelKey)}
            </a>
          ))}
          <a
            href="#home"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink"
          >
            {tFooter("backToTop")}
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m18 15-6-6-6 6" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
