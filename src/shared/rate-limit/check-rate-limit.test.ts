import { describe, expect, it } from "vitest";
import type { RateLimitCheckInput, RateLimitRepository } from "./rate-limit-repository";
import { checkRateLimit } from "./check-rate-limit";

function createFakeRateLimitRepository(countsToReturn: number[]): RateLimitRepository {
  const calls: RateLimitCheckInput[] = [];
  let index = 0;
  return {
    async incrementAndGet(input) {
      calls.push(input);
      const count = countsToReturn[index] ?? countsToReturn[countsToReturn.length - 1];
      index += 1;
      return count;
    },
    // exposed for assertions in tests below
    __calls: calls,
  } as RateLimitRepository & { __calls: RateLimitCheckInput[] };
}

describe("checkRateLimit", () => {
  it("is not limited when the incremented count is within the policy limit", async () => {
    const repository = createFakeRateLimitRepository([1]);

    const result = await checkRateLimit(
      repository,
      "hash-a",
      { endpoint: "contact", limit: 3, windowMs: 600_000 },
      new Date("2026-07-07T10:00:00.000Z"),
    );

    expect(result).toEqual({ limited: false, count: 1 });
  });

  it("is limited once the incremented count exceeds the policy limit (triangulation)", async () => {
    const repository = createFakeRateLimitRepository([4]);

    const result = await checkRateLimit(
      repository,
      "hash-a",
      { endpoint: "contact", limit: 3, windowMs: 600_000 },
      new Date("2026-07-07T10:00:00.000Z"),
    );

    expect(result).toEqual({ limited: true, count: 4 });
  });

  it("computes a deterministic fixed-window boundary from `now` and the policy's windowMs", async () => {
    const repository = createFakeRateLimitRepository([1]) as RateLimitRepository & {
      __calls: RateLimitCheckInput[];
    };

    await checkRateLimit(
      repository,
      "hash-a",
      { endpoint: "contact", limit: 3, windowMs: 600_000 },
      new Date("2026-07-07T10:04:59.000Z"),
    );

    expect(repository.__calls[0]).toEqual({
      endpoint: "contact",
      key: "hash-a",
      windowStart: new Date("2026-07-07T10:00:00.000Z"),
    });
  });
});
