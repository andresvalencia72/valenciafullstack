import { count, eq } from "drizzle-orm";
import type { Database } from "@/shared/db/database";
import { articleReactions } from "@/shared/db/schema";
import type {
  ArticleReactionRepository,
  ReactionCounts,
  ReactionKind,
} from "../domain/article-reaction-repository";

const REACTION_KINDS: readonly ReactionKind[] = ["thumbs_up", "heart", "fire"];

/**
 * `ArticleReactionRepository` implementation backed by Drizzle
 * (infrastructure: Drizzle repository implementation, persistence:
 * Infrastructure Repository Implementations). Insert-if-absent dedupe
 * uses `onConflictDoNothing` against the
 * `article_reactions_slug_visitor_hash_kind_key` unique index (see
 * schema.ts) — one reaction of each kind per (slug, visitor), permanent.
 */
export function createDrizzleArticleReactionRepository(
  db: Database,
): ArticleReactionRepository {
  return {
    async recordReaction(
      slug: string,
      visitorHash: string,
      kind: ReactionKind,
    ): Promise<boolean> {
      const inserted = await db
        .insert(articleReactions)
        .values({ slug, visitorHash, kind })
        .onConflictDoNothing()
        .returning({ id: articleReactions.id });

      return inserted.length > 0;
    },

    async countReactionsByKind(slug: string): Promise<ReactionCounts> {
      const rows = await db
        .select({ kind: articleReactions.kind, value: count() })
        .from(articleReactions)
        .where(eq(articleReactions.slug, slug))
        .groupBy(articleReactions.kind);

      const counts = Object.fromEntries(
        REACTION_KINDS.map((kind) => [kind, 0]),
      ) as ReactionCounts;

      for (const row of rows) {
        counts[row.kind] = row.value;
      }

      return counts;
    },
  };
}
