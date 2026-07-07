import { afterEach, describe, expect, it } from "vitest";
import { createPgliteTestDb, type PgliteTestDb } from "@/shared/db/create-pglite-test-db";
import type { ArticleSearchEntry } from "../domain/article-search-repository";
import { createDrizzleArticleSearchRepository } from "./drizzle-article-search-repository";

const ENTRIES: ArticleSearchEntry[] = [
  {
    slug: "clean-architecture-nextjs",
    locale: "es",
    title: "Arquitectura limpia en Next.js",
    description: "Cómo organizo un proyecto Next.js en features.",
    category: "architecture",
    bodyText:
      "La arquitectura hexagonal separa el dominio de los detalles de infraestructura.",
  },
  {
    slug: "clean-architecture-nextjs",
    locale: "en",
    title: "Clean architecture in Next.js",
    description: "How I organize a Next.js project into features.",
    category: "architecture",
    bodyText: "Hexagonal architecture keeps the domain independent from infrastructure.",
  },
  {
    slug: "design-patterns-daily",
    locale: "en",
    title: "Design patterns I use every day",
    description: "Patterns that pull their weight in real projects.",
    category: "patterns",
    bodyText: "The factory pattern and the adapter pattern show up constantly.",
  },
];

describe("createDrizzleArticleSearchRepository", () => {
  let testDb: PgliteTestDb;

  afterEach(async () => {
    await testDb?.close();
  });

  it("reconcile() upserts every entry, searchable via websearch_to_tsquery with the entry's own regconfig (search: Full-Text Query)", async () => {
    testDb = await createPgliteTestDb();
    const repository = createDrizzleArticleSearchRepository(testDb.db);

    await repository.reconcile(ENTRIES);

    const esResults = await repository.search("es", "hexagonal");
    expect(esResults).toHaveLength(1);
    expect(esResults[0]).toMatchObject({
      slug: "clean-architecture-nextjs",
      locale: "es",
      title: "Arquitectura limpia en Next.js",
    });
  });

  it("filters results to the requested locale (search: Locale filters results)", async () => {
    testDb = await createPgliteTestDb();
    const repository = createDrizzleArticleSearchRepository(testDb.db);
    await repository.reconcile(ENTRIES);

    // "hexagonal" only appears in the es body text for this slug.
    const enResults = await repository.search("en", "hexagonal");

    expect(enResults.some((r) => r.slug === "clean-architecture-nextjs" && r.locale === "es")).toBe(
      false,
    );
  });

  it("orders results by relevance rank, most relevant first (search: Relevance Ranking)", async () => {
    testDb = await createPgliteTestDb();
    const repository = createDrizzleArticleSearchRepository(testDb.db);
    await repository.reconcile([
      ...ENTRIES,
      {
        slug: "pattern-heavy-article",
        locale: "en",
        title: "Pattern pattern pattern",
        description: "Pattern pattern pattern pattern pattern.",
        category: "patterns",
        bodyText: "Pattern pattern pattern pattern pattern pattern pattern.",
      },
    ]);

    const results = await repository.search("en", "pattern");

    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results[0].slug).toBe("pattern-heavy-article");
  });

  it("returns an empty array for a query with no matches (search: No-Match Handling)", async () => {
    testDb = await createPgliteTestDb();
    const repository = createDrizzleArticleSearchRepository(testDb.db);
    await repository.reconcile(ENTRIES);

    const results = await repository.search("en", "xyzzyplugh");

    expect(results).toEqual([]);
  });

  it("does not throw on a query containing to_tsquery special characters (search: Query with special characters does not error)", async () => {
    testDb = await createPgliteTestDb();
    const repository = createDrizzleArticleSearchRepository(testDb.db);
    await repository.reconcile(ENTRIES);

    await expect(repository.search("en", "architecture & pattern | test:")).resolves.not.toThrow();
  });

  it("reconcile() prunes rows whose (slug, locale) is no longer present (search: Removed article is pruned from the index)", async () => {
    testDb = await createPgliteTestDb();
    const repository = createDrizzleArticleSearchRepository(testDb.db);
    await repository.reconcile(ENTRIES);

    // Second reconcile omits the "design-patterns-daily" (en) entry.
    await repository.reconcile(ENTRIES.filter((e) => e.slug !== "design-patterns-daily"));

    const results = await repository.search("en", "factory");
    expect(results).toEqual([]);
  });

  it("reconcile() re-run with the same entries is idempotent (upsert, not duplicate rows)", async () => {
    testDb = await createPgliteTestDb();
    const repository = createDrizzleArticleSearchRepository(testDb.db);

    await repository.reconcile(ENTRIES);
    await repository.reconcile(ENTRIES);

    const results = await repository.search("es", "hexagonal");
    expect(results).toHaveLength(1);
  });
});
