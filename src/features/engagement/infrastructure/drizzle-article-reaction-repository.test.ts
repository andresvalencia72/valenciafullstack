import { afterEach, describe, expect, it } from "vitest";
import { createPgliteTestDb, type PgliteTestDb } from "@/shared/db/create-pglite-test-db";
import { createDrizzleArticleReactionRepository } from "./drizzle-article-reaction-repository";

describe("createDrizzleArticleReactionRepository", () => {
  let testDb: PgliteTestDb;

  afterEach(async () => {
    await testDb?.close();
  });

  it("returns true on the first reaction of a kind by a visitor (engagement: Reactions with Permanent Dedupe)", async () => {
    testDb = await createPgliteTestDb();
    const repository = createDrizzleArticleReactionRepository(testDb.db);

    const inserted = await repository.recordReaction(
      "clean-architecture",
      "visitor-1",
      "heart",
    );

    expect(inserted).toBe(true);
    expect(await repository.countReactionsByKind("clean-architecture")).toEqual({
      thumbs_up: 0,
      heart: 1,
      fire: 0,
    });
  });

  it("returns false and does not double-count a duplicate reaction (triangulation: idempotent dedupe)", async () => {
    testDb = await createPgliteTestDb();
    const repository = createDrizzleArticleReactionRepository(testDb.db);

    await repository.recordReaction("clean-architecture", "visitor-1", "heart");
    const secondCall = await repository.recordReaction(
      "clean-architecture",
      "visitor-1",
      "heart",
    );

    expect(secondCall).toBe(false);
    expect(await repository.countReactionsByKind("clean-architecture")).toEqual({
      thumbs_up: 0,
      heart: 1,
      fire: 0,
    });
  });

  it("allows the same visitor to react with a different kind on the same article (triangulation: per-kind uniqueness)", async () => {
    testDb = await createPgliteTestDb();
    const repository = createDrizzleArticleReactionRepository(testDb.db);

    await repository.recordReaction("clean-architecture", "visitor-1", "heart");
    const secondKind = await repository.recordReaction(
      "clean-architecture",
      "visitor-1",
      "fire",
    );

    expect(secondKind).toBe(true);
    expect(await repository.countReactionsByKind("clean-architecture")).toEqual({
      thumbs_up: 0,
      heart: 1,
      fire: 1,
    });
  });
});
