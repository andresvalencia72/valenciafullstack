import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Database } from "./database";

/**
 * Test-only in-process Postgres bootstrap (persistence: Infrastructure
 * Repository Implementations — pglite tests). NOT shipped production
 * code; excluded from the coverage gate on the same basis as
 * `schema.ts`/`client.ts` (see vitest.config.ts) — every repository
 * integration test that uses this helper exercises it indirectly, so a
 * broken helper fails every consuming test immediately.
 *
 * Applies the real generated migration (`drizzle/0000_persistence_schema.sql`)
 * against a fresh in-memory pglite instance, rather than a hand-maintained
 * schema copy, so tests run against the same DDL that ships to production
 * (design.md Testing Strategy: pglite escape hatch — parity verified
 * during PR5b for the `spanish`/`english` regconfig and
 * `websearch_to_tsquery`, both fully supported).
 */
export interface PgliteTestDb {
  db: Database;
  close(): Promise<void>;
}

export async function createPgliteTestDb(): Promise<PgliteTestDb> {
  const client = new PGlite();
  const db = drizzle(client);

  await migrate(db, { migrationsFolder: "./drizzle" });

  return {
    db,
    close: () => client.close(),
  };
}
