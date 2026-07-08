import { LocaleSwitcher } from "@/shared/i18n/ui/locale-switcher";
import { ThemeToggle } from "@/shared/ui/theme/theme-toggle";
import { SectionNav } from "./section-nav";

/**
 * Site header (home-page: In-Page Navigation; design fidelity: header).
 * Composes design-reference/'s `<header data-nav>` brand block — a 34px
 * circular monogram + wordmark linking to `#home` — with the existing
 * `SectionNav`, `LocaleSwitcher`, and `ThemeToggle` islands.
 *
 * Two disclosed deviations from the design, kept deliberately:
 * - Sticky positioning + backdrop blur are OUR pre-existing choice
 *   (not in the design), kept as-is rather than replaced.
 * - The design's scroll-aware transparent->solid border/background
 *   swap (`initNav`'s `onScroll` handler) is NOT implemented — a
 *   static bottom border is used instead, to avoid adding new
 *   above-the-fold client JS that could risk the Lighthouse
 *   Performance budget for marginal visual benefit.
 *
 * The mobile burger menu from the design remains deferred (pre-existing
 * decision, unchanged by this fix): the full nav no longer fits a
 * 375px header alongside the locale switcher and theme toggle, so it
 * collapses below `lg`; anchors remain reachable via the footer and by
 * scrolling.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 py-4 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 lg:px-8">
        <a
          href="#home"
          className="flex items-center gap-2.75 text-ink no-underline"
        >
          <span
            aria-hidden="true"
            className="grid h-8.5 w-8.5 place-items-center rounded-full bg-ink font-display text-[18px] font-bold text-bg"
          >
            A
          </span>
          <span className="font-display text-[17px] font-semibold tracking-[-0.01em]">
            Andrés Val.
          </span>
        </a>

        <div className="hidden lg:block">
          <SectionNav />
        </div>

        <div className="flex items-center gap-4">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
