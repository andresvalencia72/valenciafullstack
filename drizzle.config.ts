import type { Config } from "drizzle-kit";

/**
 * Drizzle Kit config. `schema` points at `shared/db/schema.ts`, which
 * ships in PR5a (persistence schema slice) — this file is scaffolded
 * now so `npm run db:generate` / `npm run db:migrate` are wired ahead
 * of time, per design.md Persistence > Migration workflow.
 */
export default {
  schema: "./src/shared/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
} satisfies Config;
