import { setRequestLocale } from "next-intl/server";
import { AboutSection } from "@/features/home/ui/about-section";
import { HeroSection } from "@/features/home/ui/hero-section";
import { SectionNav } from "@/features/home/ui/section-nav";
import { SkillsSection } from "@/features/home/ui/skills-section";
import { StackStrip } from "@/features/home/ui/stack-strip";
import { LocaleSwitcher } from "@/shared/i18n/ui/locale-switcher";
import { ScrollProgress } from "@/shared/ui/scroll-progress/scroll-progress";
import { ThemeToggle } from "@/shared/ui/theme/theme-toggle";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Home page composition root (home-page: Section Composition). Renders
 * the sections implemented to date, in spec order: hero, stack strip,
 * about, skills bento. Projects, articles list, github activity,
 * contact, and footer land in later slices (Phase 3b, PR4, PR10).
 */
export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex min-h-full flex-col">
      <ScrollProgress />
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-line bg-bg/90 px-4 py-4 backdrop-blur-sm lg:px-8">
        <SectionNav />
        <div className="flex items-center gap-4">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <HeroSection />
      <StackStrip />
      <AboutSection />
      <SkillsSection />
    </main>
  );
}
