import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { AboutSection } from "@/features/home/ui/about-section";
import { ContactSection } from "@/features/home/ui/contact-section";
import { HeroSection } from "@/features/home/ui/hero-section";
import { ProjectsSection } from "@/features/home/ui/projects-section";
import { SiteFooter } from "@/features/home/ui/site-footer";
import { SiteHeader } from "@/features/home/ui/site-header";
import { SkillsSection } from "@/features/home/ui/skills-section";
import { StackStrip } from "@/features/home/ui/stack-strip";
import type { HomeArticleSummary } from "@/features/home/domain/article-summary";
import { ContactForm } from "@/features/contact/ui/contact-form";
import { GithubActivityLoading } from "@/features/github-activity/ui/github-activity-loading";
import { listPublishedArticles } from "@/shared/content/list-published-articles";
import { mdxLoader } from "@/shared/content/mdx-loader";
import type { Locale } from "@/shared/i18n/routing";
import { ScrollProgress } from "@/shared/ui/scroll-progress/scroll-progress";
import { ArticlesWithSearch } from "./_components/articles-with-search";
import { GithubActivityAsync } from "./_components/github-activity-async";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Forces per-request rendering instead of build-time static prerendering
 * for this route (PR10). `GithubActivityAsync` calls `getEnv()`, which
 * fail-fasts on a missing `DATABASE_URL`/`VISITOR_HASH_SECRET`
 * (design.md: env validation) — without this flag, `next build`'s
 * static-generation pass would execute that component eagerly at build
 * time (no Next.js dynamic API triggers automatic opt-out here, and
 * Partial Prerendering isn't enabled in `next.config.ts`), violating
 * design.md's "`next build` MUST NOT require `DATABASE_URL` to be set"
 * constraint. Deferring to request time also makes task 10.2's
 * "fetch-level revalidate (3600), not page-level ISR" meaningful — the
 * section's own GitHub API fetches are Next Data-Cache-revalidated per
 * request, while a fully static page would freeze the fetch result at
 * the last build forever.
 */
export const dynamic = "force-dynamic";

/**
 * Home page composition root (home-page: Section Composition). This is
 * the ONE place allowed to read `shared/content` directly and shape its
 * output into `home`'s own `HomeArticleSummary` view model — `home/ui`
 * never imports the `blog` feature (design.md: cross-feature imports
 * only through `shared/*`; tasks.md 3b.2). Renders the full nine-section
 * set in spec order: hero, stack strip, about, skills bento, projects,
 * articles list, github activity, contact, footer. Github activity
 * streams independently via `<Suspense>` around `GithubActivityAsync`
 * (github-activity: Non-Blocking Render).
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
      <SiteHeader />
      <HeroSection />
      <StackStrip />
      <AboutSection />
      <SkillsSection />
      <ProjectsSection />
      <ArticlesWithSearch articles={articles} locale={locale as Locale} />
      <Suspense fallback={<GithubActivityLoading />}>
        <GithubActivityAsync />
      </Suspense>
      <ContactSection>
        <ContactForm />
      </ContactSection>
      <SiteFooter />
    </main>
  );
}
