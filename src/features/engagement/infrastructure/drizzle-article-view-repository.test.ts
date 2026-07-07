import { afterEach, describe, expect, it } from "vitest";
import { createPgliteTestDb, type PgliteTestDb } from "@/shared/db/create-pglite-test-db";
import { createDrizzleArticleViewRepository } from "./drizzle-article-view-repository";

describe("createDrizzleArticleViewRepository", () => {
  let testDb: PgliteTestDb;

  afterEach(async () => {
    await testDb?.close();
  });

  it("returns true on the first view for a (slug, visitorHash) pair (engagement: View Counting with Permanent Dedupe)", async () => {
    testDb = await createPgliteTestDb();
    const repository = createDrizzleArticleViewRepository(testDb.db);

    const inserted = await repository.recordView("clean-architecture", "visitor-1");

    expect(inserted).toBe(true);
    expect(await repository.countViews("clean-architecture")).toBe(1);
  });

  it("returns false and does not double-count a repeat view from the same visitor (triangulation: permanent dedupe)", async () => {
    testDb = await createPgliteTestDb();
    const repository = createDrizzleArticleViewRepository(testDb.db);

    await repository.recordView("clean-architecture", "visitor-1");
    const secondCall = await repository.recordView("clean-architecture", "visitor-1");

    expect(secondCall).toBe(false);
    expect(await repository.countViews("clean-architecture")).toBe(1);
  });

  it("returns 0 for a slug with no recorded views (triangulation: zero-match aggregate)", async () => {
    testDb = await createPgliteTestDb();
    const repository = createDrizzleArticleViewRepository(testDb.db);

    await repository.recordView("clean-architecture", "visitor-1");

    expect(await repository.countViews("never-viewed-slug")).toBe(0);
  });

  it("counts distinct visitors independently per slug (triangulation: aggregate scoping)", async () => {
    testDb = await createPgliteTestDb();
    const repository = createDrizzleArticleViewRepository(testDb.db);

    await repository.recordView("clean-architecture", "visitor-1");
    await repository.recordView("clean-architecture", "visitor-2");
    await repository.recordView("other-article", "visitor-1");

    expect(await repository.countViews("clean-architecture")).toBe(2);
    expect(await repository.countViews("other-article")).toBe(1);
  });
});
