import { setRequestLocale } from "next-intl/server";
import { AboutSection } from "@/features/home/ui/about-section";
import { ArticlesSection } from "@/features/home/ui/articles-section";
import { ContactSection } from "@/features/home/ui/contact-section";
import { HeroSection } from "@/features/home/ui/hero-section";
import { ProjectsSection } from "@/features/home/ui/projects-section";
import { SectionNav } from "@/features/home/ui/section-nav";
import { SiteFooter } from "@/features/home/ui/site-footer";
import { SkillsSection } from "@/features/home/ui/skills-section";
import { StackStrip } from "@/features/home/ui/stack-strip";
import type { HomeArticleSummary } from "@/features/home/domain/article-summary";
import { ContactForm } from "@/features/contact/ui/contact-form";
import { listPublishedArticles } from "@/shared/content/list-published-articles";
import { mdxLoader } from "@/shared/content/mdx-loader";
import { LocaleSwitcher } from "@/shared/i18n/ui/locale-switcher";
import type { Locale } from "@/shared/i18n/routing";
import { ScrollProgress } from "@/shared/ui/scroll-progress/scroll-progress";
import { ThemeToggle } from "@/shared/ui/theme/theme-toggle";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Home page composition root (home-page: Section Composition). This is
 * the ONE place allowed to read `shared/content` directly and shape its
 * output into `home`'s own `HomeArticleSummary` view model — `home/ui`
 * never imports the `blog` feature (design.md: cross-feature imports
 * only through `shared/*`; tasks.md 3b.2). Renders the sections
 * implemented to date, in spec order: hero, stack strip, about, skills
 * bento, projects, articles list, contact, footer. Github activity
 * lands in the last slice (PR10).
 */
export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const articles: HomeArticleSummary[] = listPublishedArticles(
    mdxLoader,
    locale as Locale,
  ).map((article) => ({
    slug: article.slug,
    title: article.title,
    excerpt: article.description,
    category: article.category,
    date: article.date,
    readingTimeMinutes: article.readingTimeMinutes,
  }));

  return (
    <main className="flex min-h-full flex-col">
      <ScrollProgress />
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-line bg-bg/90 px-4 py-4 backdrop-blur-sm lg:px-8">
        {/* Nav collapses below `lg` — the full six-item nav (home-page:
         * In-Page Navigation) no longer fits a 375px header alongside
         * the locale switcher and theme toggle now that projects/
         * articles/contact were added (PR3b). A mobile burger menu
         * (present in design-reference/) is deferred; anchors remain
         * reachable via the footer and by scrolling. */}
        <div className="hidden lg:block">
          <SectionNav />
        </div>
        <div className="flex items-center gap-4">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <HeroSection />
      <StackStrip />
      <AboutSection />
      <SkillsSection />
      <ProjectsSection />
      <ArticlesSection articles={articles} />
      <ContactSection>
        <ContactForm />
      </ContactSection>
      <SiteFooter />
    </main>
  );
}
