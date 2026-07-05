import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
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
