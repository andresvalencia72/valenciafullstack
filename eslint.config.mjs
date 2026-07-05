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
