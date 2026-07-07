import { and, eq, sql } from "drizzle-orm";
import type { Database } from "@/shared/db/database";
import { articleSearch } from "@/shared/db/schema";
import { regconfigForLocale } from "../domain/regconfig-for-locale";
import type {
  ArticleSearchEntry,
  ArticleSearchRepository,
  ArticleSearchResultRow,
  SearchLocale,
} from "../domain/article-search-repository";

/** Weighted per design.md Persistence: title=A, body_text=B, description=C. */
function buildSearchVectorExpr(
  regconfig: "spanish" | "english",
  title: string,
  bodyText: string,
  description: string,
) {
  return sql`
    setweight(to_tsvector(${regconfig}::regconfig, ${title}), 'A') ||
    setweight(to_tsvector(${regconfig}::regconfig, ${bodyText}), 'B') ||
    setweight(to_tsvector(${regconfig}::regconfig, ${description}), 'C')
  `;
}

/**
 * `ArticleSearchRepository` implementation backed by Drizzle
 * (infrastructure: Drizzle repository implementation, persistence:
 * Infrastructure Repository Implementations). `search_vector` is a
 * plain column (see schema.ts) refreshed here on every `reconcile()`
 * call — there is no trigger or generated-column expression (Postgres
 * classifies `to_tsvector` as STABLE, not IMMUTABLE, so it cannot back a
 * generated column; see PR5a apply findings).
 */
export function createDrizzleArticleSearchRepository(
  db: Database,
): ArticleSearchRepository {
  return {
    async reconcile(entries: ArticleSearchEntry[]): Promise<void> {
      await db.transaction(async (tx) => {
        for (const entry of entries) {
          const regconfig = regconfigForLocale(entry.locale);
          const searchVector = buildSearchVectorExpr(
            regconfig,
            entry.title,
            entry.bodyText,
            entry.description,
          );

          await tx
            .insert(articleSearch)
            .values({
              slug: entry.slug,
              locale: entry.locale,
              title: entry.title,
              description: entry.description,
              category: entry.category,
              bodyText: entry.bodyText,
              searchVector,
            })
            .onConflictDoUpdate({
              target: [articleSearch.slug, articleSearch.locale],
              set: {
                title: entry.title,
                description: entry.description,
                category: entry.category,
                bodyText: entry.bodyText,
                searchVector,
              },
            });
        }

        // Prune: delete any existing (slug, locale) row absent from
        // `entries` (search: Index Sync Full Reconcile). Diffed in JS
        // rather than a single SQL composite "(slug, locale) NOT IN
        // (...)" clause — postgres.js/Drizzle tuple-IN parameter binding
        // is fragile and this two-query diff is simple to reason about
        // and to test.
        const currentKeys = new Set(
          entries.map((entry) => `${entry.slug}::${entry.locale}`),
        );
        const existingRows = await tx
          .select({ slug: articleSearch.slug, locale: articleSearch.locale })
          .from(articleSearch);

        for (const row of existingRows) {
          if (!currentKeys.has(`${row.slug}::${row.locale}`)) {
            await tx
              .delete(articleSearch)
              .where(
                and(
                  eq(articleSearch.slug, row.slug),
                  eq(articleSearch.locale, row.locale),
                ),
              );
          }
        }
      });
    },

    async search(
      locale: SearchLocale,
      query: string,
    ): Promise<ArticleSearchResultRow[]> {
      const regconfig = regconfigForLocale(locale);
      const tsQuery = sql`websearch_to_tsquery(${regconfig}::regconfig, ${query})`;

      const rows = await db
        .select({
          slug: articleSearch.slug,
          locale: articleSearch.locale,
          title: articleSearch.title,
          description: articleSearch.description,
          category: articleSearch.category,
          rank: sql<number>`ts_rank(${articleSearch.searchVector}, ${tsQuery})`,
        })
        .from(articleSearch)
        .where(
          and(
            eq(articleSearch.locale, locale),
            sql`${articleSearch.searchVector} @@ ${tsQuery}`,
          ),
        )
        .orderBy(sql`ts_rank(${articleSearch.searchVector}, ${tsQuery}) desc`);

      return rows.map((row) => ({
        slug: row.slug,
        locale: row.locale,
        title: row.title,
        description: row.description,
        category: row.category,
      }));
    },
  };
}
