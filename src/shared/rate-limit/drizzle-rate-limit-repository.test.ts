import { afterEach, describe, expect, it } from "vitest";
import { createPgliteTestDb, type PgliteTestDb } from "@/shared/db/create-pglite-test-db";
import { createDrizzleRateLimitRepository } from "./drizzle-rate-limit-repository";

const WINDOW_START = new Date("2026-07-07T10:00:00.000Z");

describe("createDrizzleRateLimitRepository", () => {
  let testDb: PgliteTestDb;

  afterEach(async () => {
    await testDb?.close();
  });

  it("returns 1 for the first request in a window (security: Rate Limiting)", async () => {
    testDb = await createPgliteTestDb();
    const repository = createDrizzleRateLimitRepository(testDb.db);

    const count = await repository.incrementAndGet({
      endpoint: "contact",
      key: "ip-hash-1",
      windowStart: WINDOW_START,
    });

    expect(count).toBe(1);
  });

  it("increments atomically on repeat requests within the same window (triangulation)", async () => {
    testDb = await createPgliteTestDb();
    const repository = createDrizzleRateLimitRepository(testDb.db);

    await repository.incrementAndGet({
      endpoint: "contact",
      key: "ip-hash-1",
      windowStart: WINDOW_START,
    });
    await repository.incrementAndGet({
      endpoint: "contact",
      key: "ip-hash-1",
      windowStart: WINDOW_START,
    });
    const third = await repository.incrementAndGet({
      endpoint: "contact",
      key: "ip-hash-1",
      windowStart: WINDOW_START,
    });

    expect(third).toBe(3);
  });

  it("tracks each endpoint's counter independently for the same key/window (triangulation: per-endpoint scoping)", async () => {
    testDb = await createPgliteTestDb();
    const repository = createDrizzleRateLimitRepository(testDb.db);

    await repository.incrementAndGet({
      endpoint: "contact",
      key: "ip-hash-1",
      windowStart: WINDOW_START,
    });
    await repository.incrementAndGet({
      endpoint: "contact",
      key: "ip-hash-1",
      windowStart: WINDOW_START,
    });
    const engagementCount = await repository.incrementAndGet({
      endpoint: "engagement:views",
      key: "ip-hash-1",
      windowStart: WINDOW_START,
    });

    expect(engagementCount).toBe(1);
  });
});
