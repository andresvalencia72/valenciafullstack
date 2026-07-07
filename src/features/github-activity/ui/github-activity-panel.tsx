import { useTranslations } from "next-intl";
import { Reveal } from "@/shared/ui/motion/reveal";
import type { GithubActivityResult } from "../application/get-github-activity";

interface GithubActivityPanelProps {
  /**
   * Server-fetched result, produced by the `app/` composition root
   * calling `application/get-github-activity.ts` — `ui` never imports
   * `infrastructure` directly (design.md Boundary Rules).
   */
  result: GithubActivityResult;
}

/**
 * GitHub activity section (home-page: Section Composition — github
 * activity, lands between articles and contact). Renders either the
 * fetched repositories/stats or the fallback panel, purely from the
 * `result` prop — the data fetch itself happens above this component,
 * in the Suspense-streamed `app/` composition root (github-activity:
 * Non-Blocking Render, Graceful Failure Handling).
 */
export function GithubActivityPanel({ result }: GithubActivityPanelProps) {
  const t = useTranslations("home.githubActivity");

  return (
    <section
      id="github-activity"
      className="mx-auto max-w-6xl px-4 py-20 lg:px-8 lg:py-32"
    >
      <Reveal>
        <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
          <h2 className="font-display text-4xl leading-none font-semibold tracking-tight lg:text-7xl">
            {t("heading")}.
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
            {t("subheading")}
          </p>
        </div>
      </Reveal>

      {result.kind === "unavailable" ? (
        // `aria-live` (no `role="status"`) announces the fallback to
        // assistive tech without claiming the page-wide implicit
        // "status" role — `ContactSection`'s own status message
        // already uses that role, and this section can render
        // simultaneously with it on the same page (github-activity:
        // Graceful Failure Handling; caught by e2e/contact.spec.ts's
        // `getByRole("status")` becoming ambiguous once both were
        // present).
        <p
          aria-live="polite"
          className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-ink-soft"
        >
          {t("unavailable")}
        </p>
      ) : (
        <Reveal>
          <div className="mb-6 flex flex-wrap gap-6 font-mono text-sm text-ink-soft">
            <span>{t("publicRepos", { count: result.data.publicRepoCount })}</span>
            <span>{t("followers", { count: result.data.followerCount })}</span>
            <span>
              {t("recentActivity", { count: result.data.recentContributionCount })}
            </span>
          </div>
          <ul className="grid list-none gap-3.5 p-0 md:grid-cols-2 lg:grid-cols-3">
            {result.data.topRepositories.map((repo) => (
              <li key={repo.name}>
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener"
                  className="flex h-full flex-col gap-2 rounded-2xl border border-line bg-card p-4.5 no-underline transition-[border-color,transform] hover:translate-x-1 hover:border-coral"
                >
                  <h3 className="m-0 font-display text-lg leading-tight font-semibold tracking-tight text-ink">
                    {repo.name}
                  </h3>
                  {repo.description && (
                    <p className="truncate text-sm text-ink-soft">
                      {repo.description}
                    </p>
                  )}
                  <div className="mt-auto flex gap-3 font-mono text-xs text-ink-faint">
                    {repo.language && <span>{repo.language}</span>}
                    <span>★ {repo.stars}</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      )}
    </section>
  );
}
