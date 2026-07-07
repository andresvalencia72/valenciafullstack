import { count, eq } from "drizzle-orm";
import type { Database } from "@/shared/db/database";
import { articleViews } from "@/shared/db/schema";
import type { ArticleViewRepository } from "../domain/article-view-repository";

/**
 * `ArticleViewRepository` implementation backed by Drizzle
 * (infrastructure: Drizzle repository implementation, persistence:
 * Infrastructure Repository Implementations). Insert-if-absent dedupe
 * uses `onConflictDoNothing` against the `article_views_slug_visitor_hash_key`
 * unique index (see schema.ts) — a permanent dedupe, not a rolling window.
 */
export function createDrizzleArticleViewRepository(
  db: Database,
): ArticleViewRepository {
  return {
    async recordView(slug: string, visitorHash: string): Promise<boolean> {
      const inserted = await db
        .insert(articleViews)
        .values({ slug, visitorHash })
        .onConflictDoNothing()
        .returning({ id: articleViews.id });

      return inserted.length > 0;
    },

    async countViews(slug: string): Promise<number> {
      // `count()` with no GROUP BY always returns exactly one row (0 when
      // no rows match) — no `?? 0` fallback needed, unlike the reaction
      // repository's grouped query where a kind can be absent entirely.
      const [row] = await db
        .select({ value: count() })
        .from(articleViews)
        .where(eq(articleViews.slug, slug));

      return row.value;
    },
  };
}
