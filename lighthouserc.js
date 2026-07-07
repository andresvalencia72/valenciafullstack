/**
 * Lighthouse CI budget (quality-pipeline: Lighthouse Performance Budget).
 *
 * Lighthouse's default run (no `formFactor`/`throttling` overrides) already
 * emulates a mobile device with simulated slow-4G throttling — that IS the
 * "mobile preset" the spec calls for, so no explicit preset override is
 * needed here.
 *
 * URLs cover the site's three distinct rendering shapes so the budget
 * actually exercises real page weight, not just one route:
 *   - `/es` — the home page (default locale, the heaviest single page:
 *     hero/about/skills/projects/articles/search/github-activity/contact).
 *   - `/en` — the secondary locale, same page shape, different content.
 *   - `/es/blog/clean-architecture-nextjs` — an MDX article page (syntax
 *     highlighting, different layout from the home page).
 *
 * Thresholds match the quality-pipeline spec exactly: Performance >= 90,
 * Accessibility >= 95, Best Practices >= 95, SEO >= 95. This gate is wired
 * and enforced starting PR11 (task 11.3); prior PRs ran a non-blocking
 * stub (task 1.6) — see `.github/workflows/ci.yml`'s `lighthouse` job.
 */
module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:3000/es",
        "http://localhost:3000/en",
        "http://localhost:3000/es/blog/clean-architecture-nextjs",
      ],
      startServerCommand: "npm run start",
      startServerReadyPattern: "Ready in",
      startServerReadyTimeout: 60000,
      // A single Lighthouse Performance run is measurement-noise-prone
      // (CPU/network jitter on any shared CI runner can easily swing the
      // score several points) — empirically confirmed locally, where a
      // single `/es` run varied between 0.88 and 0.95 across back-to-back
      // executions with zero code changes. LHCI's own guidance is >=3
      // runs per URL so the assert stage evaluates the median run
      // instead of one noisy sample.
      numberOfRuns: 3,
      settings: {
        // CI runners (and sandboxed local dev containers) run Chrome as
        // root/without a user namespace, which breaks Chrome's own
        // internal sandbox and otherwise renders a Chrome-side
        // interstitial instead of the real page. `--no-sandbox` is the
        // standard, widely-documented Lighthouse CI flag for headless
        // Chrome under containerized CI (GitHub Actions runners included).
        chromeFlags: "--no-sandbox --disable-gpu --headless=new",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 0.95 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./.lighthouseci",
    },
  },
};
