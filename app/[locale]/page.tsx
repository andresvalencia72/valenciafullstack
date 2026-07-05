import { setRequestLocale } from "next-intl/server";
import { LocaleSwitcher } from "@/shared/i18n/ui/locale-switcher";
import { ScrollProgress } from "@/shared/ui/scroll-progress/scroll-progress";
import { ThemeToggle } from "@/shared/ui/theme/theme-toggle";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Home page composition root. Section content (hero, about, projects,
 * etc.) lands in later slices (Phase 3a/3b) — this PR ships the shared
 * design-system shell (theme toggle, scroll progress, locale switcher)
 * that those sections will compose into.
 */
export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex min-h-full flex-col">
      <ScrollProgress />
      <header className="flex items-center justify-end gap-4 p-4">
        <LocaleSwitcher />
        <ThemeToggle />
      </header>
    </main>
  );
}
