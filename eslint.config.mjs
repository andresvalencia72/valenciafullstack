import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

// Screaming-architecture boundary rules (see design.md > Boundary Rules).
// Each feature carries domain/application/infrastructure/ui layers;
// `app/*` is the composition root; cross-feature imports are only
// allowed through `shared/*`.
const boundariesConfig = {
  files: ["app/**/*.{ts,tsx}", "src/**/*.{ts,tsx}"],
  plugins: { boundaries },
  settings: {
    // Required so the plugin can resolve TS path-alias (`@/*`) and
    // extensionless relative imports to real files — without this,
    // dependencies resolve as "unknown" and boundary rules never fire.
    "import/resolver": {
      typescript: true,
      node: { extensions: [".js", ".jsx", ".ts", ".tsx"] },
    },
    "boundaries/include": ["app/**/*", "src/**/*"],
    "boundaries/elements": [
      {
        type: "domain",
        pattern: "src/features/(*)/domain/**",
        mode: "full",
        capture: ["feature"],
      },
      {
        type: "application",
        pattern: "src/features/(*)/application/**",
        mode: "full",
        capture: ["feature"],
      },
      {
        type: "infrastructure",
        pattern: "src/features/(*)/infrastructure/**",
        mode: "full",
        capture: ["feature"],
      },
      {
        type: "ui",
        pattern: "src/features/(*)/ui/**",
        mode: "full",
        capture: ["feature"],
      },
      {
        type: "shared",
        pattern: "src/shared/**",
        mode: "full",
      },
      {
        type: "app",
        pattern: "app/**",
        mode: "full",
      },
    ],
  },
  rules: {
    // NOTE: capture-scoped selectors MUST use the `{ to: { type, captured } }`
    // object form below, not the legacy `[type, { captured }]` tuple form.
    // The tuple form silently no-ops (never matches, in either direction)
    // when combined with `captured` in eslint-plugin-boundaries@6.0.2 —
    // verified empirically while wiring this config. If upgrading the
    // plugin, re-verify same-feature enforcement still triggers before
    // trusting this rule set (see the ESLint boundaries risk in PR1's
    // apply report).
    "boundaries/dependencies": [
      "error",
      {
        default: "disallow",
        message:
          "{{from.type}} may not import {{to.type}} (see design.md > Boundary Rules).",
        rules: [
          {
            from: { type: "domain" },
            allow: [],
          },
          {
            from: { type: "application" },
            allow: [
              {
                to: {
                  type: "domain",
                  captured: { feature: "{{from.captured.feature}}" },
                },
              },
              // Same-feature application -> application (a use-case's
              // co-located `*.test.ts` importing the module it tests)
              // is allowed; cross-feature stays disallowed by the
              // capture match. Symmetric with the `ui` same-feature
              // fix found in PR3a — see eslint boundaries note there.
              {
                to: {
                  type: "application",
                  captured: { feature: "{{from.captured.feature}}" },
                },
              },
              // Added in PR6: cross-cutting `shared/rate-limit/*`
              // (RateLimitRepository, checkRateLimit) is designed to be
              // injected into feature application-layer orchestration —
              // PR5b's own findings explicitly anticipate this ("gives
              // PR6/PR7/PR8 a ready-made ... primitive to call from
              // their application-layer orchestration"). Without this
              // entry, the contact/engagement/search use-cases could
              // not accept a `RateLimitRepository` dependency at all.
              { to: { type: "shared" } },
            ],
          },
          {
            from: { type: "infrastructure" },
            allow: [
              {
                to: {
                  type: "domain",
                  captured: { feature: "{{from.captured.feature}}" },
                },
              },
              // Same-feature infrastructure -> infrastructure, same
              // rationale as the `application` same-feature entry above.
              {
                to: {
                  type: "infrastructure",
                  captured: { feature: "{{from.captured.feature}}" },
                },
              },
              { to: { type: "shared" } },
            ],
          },
          {
            from: { type: "ui" },
            allow: [
              {
                to: {
                  type: "domain",
                  captured: { feature: "{{from.captured.feature}}" },
                },
              },
              {
                to: {
                  type: "application",
                  captured: { feature: "{{from.captured.feature}}" },
                },
              },
              // Same-feature ui -> ui (e.g. a section composing a
              // sibling sub-component within its own feature's `ui`
              // folder) is allowed; cross-feature ui -> ui stays
              // disallowed by the capture match. Verified with
              // src/features/home/ui (first real feature folder to
              // exercise this rule) — PR1 only fixture-tested it.
              {
                to: {
                  type: "ui",
                  captured: { feature: "{{from.captured.feature}}" },
                },
              },
              { to: { type: "shared" } },
            ],
          },
          {
            from: { type: "app" },
            allow: [
              { to: { type: "app" } },
              { to: { type: "ui" } },
              { to: { type: "application" } },
              { to: { type: "infrastructure" } },
              { to: { type: "shared" } },
              // Composition roots wire a feature's infrastructure repo
              // into its application use cases and need the domain
              // entity/locale types to type that wiring correctly
              // (e.g. `app/[locale]/blog/[slug]/page.tsx` importing
              // `ArticleLocale`) — first exercised in PR4.
              { to: { type: "domain" } },
            ],
          },
          {
            from: { type: "shared" },
            allow: [{ to: { type: "shared" } }],
          },
        ],
      },
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  boundariesConfig,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Exported design reference artifacts (claude.ai/design output), not
    // application source — not owned/maintained code.
    "design-reference/**",
    // Generated test/coverage output (gitignored).
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
