import type { PgDatabase } from "drizzle-orm/pg-core";

/**
 * Driver-agnostic Drizzle database handle accepted by infrastructure
 * repositories (persistence: Infrastructure Repository Implementations).
 *
 * Both `getDb()` (production, `drizzle-orm/postgres-js`) and the pglite
 * test database created by `createPgliteTestDb()` extend `PgDatabase`
 * from the same `drizzle-orm/pg-core` module, so a repository typed
 * against this alias accepts either without depending on a specific
 * driver. Declarative type alias only — no runtime behavior — same
 * exclusion basis as `schema.ts`/`client.ts` (see vitest.config.ts).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- driver-agnostic handle deliberately erases the query-result/schema generics.
export type Database = PgDatabase<any, any, any>;
