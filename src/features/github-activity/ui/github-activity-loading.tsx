import { useTranslations } from "next-intl";

/**
 * Suspense fallback for the GitHub activity section (github-activity:
 * Non-Blocking Render — "the section MUST display a loading state until
 * data resolves"). Shares `id="github-activity"` with the resolved
 * `GithubActivityPanel` so anchor navigation and the section-order DOM
 * shape stay stable across the streaming swap.
 */
export function GithubActivityLoading() {
  const t = useTranslations("home.githubActivity");

  return (
    <section
      id="github-activity"
      aria-busy="true"
      className="mx-auto max-w-6xl px-4 py-20 lg:px-8 lg:py-32"
    >
      <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
        <h2 className="font-display text-4xl leading-none font-semibold tracking-tight lg:text-7xl">
          {t("heading")}.
        </h2>
      </div>
      {/* `aria-live` (no `role="status"`) — same rationale as
       * `GithubActivityPanel`'s fallback: avoids colliding with
       * `ContactForm`'s page-wide `role="status"` message when both
       * are present on the page at once. */}
      <p
        aria-live="polite"
        className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-ink-soft"
      >
        {t("loading")}
      </p>
    </section>
  );
}
