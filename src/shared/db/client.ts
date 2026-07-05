import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "@/shared/config/env";

/**
 * Drizzle client factory (Factory pattern, see design.md Patterns table).
 *
 * `getDb()` lazily creates a single Postgres connection pool per runtime
 * process and reuses it across calls. `env.ts` is only imported here and
 * only invoked inside this function body — never at module scope — so
 * importing this module does not require `DATABASE_URL` to be set at
 * `next build` time.
 *
 * This module never imports from `features/*`; features depend on this
 * module only from their `infrastructure` layer (see Boundary Rules).
 */

type Database = ReturnType<typeof drizzle>;

declare global {
  var __portfolioDb: Database | undefined;
}

export function getDb(): Database {
  if (globalThis.__portfolioDb) {
    return globalThis.__portfolioDb;
  }

  const { DATABASE_URL } = getEnv();
  const client = postgres(DATABASE_URL, { max: 10 });
  const db = drizzle(client);

  globalThis.__portfolioDb = db;
  return db;
}
