import { sql } from "drizzle-orm";
import type { Database } from "@/shared/db/database";
import { rateLimits } from "@/shared/db/schema";
import type {
  RateLimitCheckInput,
  RateLimitRepository,
} from "./rate-limit-repository";

/**
 * `RateLimitRepository` implementation backed by Drizzle
 * (infrastructure: Drizzle repository implementation, persistence:
 * Infrastructure Repository Implementations). A single atomic
 * `INSERT ... ON CONFLICT (endpoint, key, window_start) DO UPDATE SET
 * count = count + 1 RETURNING count` upsert, scoped per endpoint per
 * schema.ts's `rateLimits` primary key.
 */
export function createDrizzleRateLimitRepository(
  db: Database,
): RateLimitRepository {
  return {
    async incrementAndGet({
      endpoint,
      key,
      windowStart,
    }: RateLimitCheckInput): Promise<number> {
      const rows = await db
        .insert(rateLimits)
        .values({ endpoint, key, windowStart, count: 1 })
        .onConflictDoUpdate({
          target: [rateLimits.endpoint, rateLimits.key, rateLimits.windowStart],
          set: { count: sql`${rateLimits.count} + 1` },
        })
        .returning({ count: rateLimits.count });

      return rows[0].count;
    },
  };
}
