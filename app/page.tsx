import { ScrollProgress } from "@/shared/ui/scroll-progress/scroll-progress";
import { ThemeToggle } from "@/shared/ui/theme/theme-toggle";

/**
 * Home page composition root (interim, unlocalized).
 *
 * Section content (hero, about, projects, etc.) and locale-aware
 * routing land in later slices (PR2b, Phase 3a/3b) — this PR ships
 * the shared design-system shell (theme toggle, scroll progress) that
 * those sections will compose into.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-full flex-col">
      <ScrollProgress />
      <header className="flex items-center justify-end gap-4 p-4">
        <ThemeToggle />
      </header>
    </main>
  );
}
