import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  ssr: {
    // Force Vite to process `next-intl` through its own transform/
    // resolve pipeline (instead of treating it as an SSR-external raw
    // Node import) so the `resolve.alias` below actually applies to
    // its internal `next/navigation` import.
    noExternal: ["next-intl"],
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
      // `next` ships without a package.json "exports" map, so bare
      // extensionless deep imports like "next/navigation" (as used
      // internally by `next-intl/navigation`) fail Vite's SSR-external
      // resolution under Vitest, even though real Next.js builds
      // resolve them fine via the framework's own bundler. Alias to
      // the concrete file so tests exercising `next-intl`'s
      // `createNavigation` hooks (locale switcher) can load it.
      "next/navigation": path.resolve(rootDir, "node_modules/next/navigation.js"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    // jsdom only initializes `localStorage`/`sessionStorage` for an
    // http(s) origin — the default "about:blank" document throws
    // `SecurityError: Cannot initialize local storage without a
    // '--localstorage-file' path`. Theme persistence tests (design-system:
    // Theme Toggle) need a real storage-capable origin.
    environmentOptions: {
      jsdom: {
        url: "http://localhost:3000",
      },
    },
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      // Coverage is scoped to src/** and scripts/** per quality-pipeline
      // spec (Coverage Threshold). `app/` route adapters, build/tool
      // config files, and the declarative shared/db/schema.ts +
      // shared/db/client.ts bootstrap files are excluded.
      include: ["src/**/*.{ts,tsx}", "scripts/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
        "src/shared/db/schema.ts",
        "src/shared/db/client.ts",
        // Driver-agnostic type alias (zero runtime behavior) and the
        // pglite test-database bootstrap used only by repository
        // integration tests — same declarative/test-infra exclusion
        // basis as the two files above (see persistence: Infrastructure
        // Repository Implementations, PR5b).
        "src/shared/db/database.ts",
        "src/shared/db/create-pglite-test-db.ts",
        // `next/font/local` is a Next.js build-pipeline macro (SWC/Turbopack
        // font-loader transform) — it throws when imported outside that
        // pipeline (verified: `localFont(...)` is not a function under
        // plain Vitest/jsdom). Zero business logic lives here (declarative
        // font declarations only), so it's excluded on the same basis as
        // the `shared/db` bootstrap files above; font wiring itself is
        // exercised by `next build` + Playwright, not Vitest.
        "src/shared/ui/fonts/index.ts",
      ],
      // Vitest v8 coverage always reports every file matched by `include`
      // (there is no `all: false` opt-out in this version). This still
      // satisfies the quality-pipeline spec's "auto-pass when zero
      // coverage-eligible files exist" requirement: when the `include`
      // glob matches zero files, the report is empty (0/0) and the
      // threshold check exits 0 rather than failing — verified via
      // `vitest run --coverage --coverage.include="<empty-glob>"`
      // during PR1. Any file that DOES match `include` is expected to
      // carry tests; do not rely on this behavior to defer testing a
      // file that already exists under `src/**` or `scripts/**`.
      thresholds: {
        lines: 80,
        branches: 80,
      },
    },
  },
});
