import { describe, expect, it, vi } from "vitest";
import type { ArticleReactionRepository } from "../domain/article-reaction-repository";
import type { ArticleSlugChecker } from "../domain/article-slug-checker";
import {
  recordArticleReaction,
  type RecordArticleReactionDeps,
} from "./record-article-reaction";

function makeDeps(
  overrides: Partial<RecordArticleReactionDeps> = {},
): RecordArticleReactionDeps {
  return {
    articleReactionRepository: {
      recordReaction: vi.fn().mockResolvedValue(true),
      countReactionsByKind: vi.fn().mockResolvedValue({
        thumbs_up: 0,
        heart: 0,
        fire: 0,
      }),
    } satisfies ArticleReactionRepository,
    rateLimitRepository: {
      incrementAndGet: vi.fn().mockResolvedValue(1),
    },
    articleSlugChecker: {
      isPublishedSlug: vi.fn().mockResolvedValue(true),
    } satisfies ArticleSlugChecker,
    ...overrides,
  };
}

describe("recordArticleReaction", () => {
  it("records a first reaction and returns 'recorded' (engagement: Reactions with Permanent Dedupe — Add reaction)", async () => {
    const deps = makeDeps();

    const result = await recordArticleReaction(deps, {
      rawBody: { slug: "clean-architecture-nextjs", kind: "heart" },
      visitorHash: "visitor-hash",
      ipHash: "ip-hash",
    });

    expect(result).toEqual({ kind: "recorded" });
    expect(deps.articleReactionRepository.recordReaction).toHaveBeenCalledWith(
      "clean-architecture-nextjs",
      "visitor-hash",
      "heart",
    );
  });

  it("returns 'recorded' for a duplicate reaction too — idempotent, never a distinct outcome (engagement: Duplicate reaction is idempotent, triangulation)", async () => {
    const deps = makeDeps({
      articleReactionRepository: {
        recordReaction: vi.fn().mockResolvedValue(false),
        countReactionsByKind: vi.fn(),
      },
    });

    const result = await recordArticleReaction(deps, {
      rawBody: { slug: "clean-architecture-nextjs", kind: "heart" },
      visitorHash: "visitor-hash",
      ipHash: "ip-hash",
    });

    expect(result).toEqual({ kind: "recorded" });
  });

  it("returns 'invalid' for a reaction kind outside the fixed enum (engagement: Invalid reaction type)", async () => {
    const deps = makeDeps();

    const result = await recordArticleReaction(deps, {
      rawBody: { slug: "clean-architecture-nextjs", kind: "like" },
      visitorHash: "visitor-hash",
      ipHash: "ip-hash",
    });

    expect(result).toEqual({ kind: "invalid" });
    expect(deps.articleReactionRepository.recordReaction).not.toHaveBeenCalled();
  });

  it("returns 'not-found' for a slug outside the published article set (engagement: Unknown slug rejected)", async () => {
    const deps = makeDeps({
      articleSlugChecker: { isPublishedSlug: vi.fn().mockResolvedValue(false) },
    });

    const result = await recordArticleReaction(deps, {
      rawBody: { slug: "does-not-exist", kind: "fire" },
      visitorHash: "visitor-hash",
      ipHash: "ip-hash",
    });

    expect(result).toEqual({ kind: "not-found" });
    expect(deps.articleReactionRepository.recordReaction).not.toHaveBeenCalled();
  });

  it("returns 'rate-limited' and skips validation/persistence when the ip_hash budget is exhausted (security: Rate Limiting on Write/Query Endpoints)", async () => {
    const deps = makeDeps({
      rateLimitRepository: { incrementAndGet: vi.fn().mockResolvedValue(21) },
    });

    const result = await recordArticleReaction(deps, {
      rawBody: { slug: "clean-architecture-nextjs", kind: "fire" },
      visitorHash: "visitor-hash",
      ipHash: "ip-hash",
    });

    expect(result).toEqual({ kind: "rate-limited" });
    expect(deps.articleSlugChecker.isPublishedSlug).not.toHaveBeenCalled();
  });

  it("returns 'persistence-failed' when the repository write throws (engagement: Graceful Degradation When Database Unavailable)", async () => {
    const deps = makeDeps({
      articleReactionRepository: {
        recordReaction: vi.fn().mockRejectedValue(new Error("connection refused")),
        countReactionsByKind: vi.fn(),
      },
    });

    const result = await recordArticleReaction(deps, {
      rawBody: { slug: "clean-architecture-nextjs", kind: "fire" },
      visitorHash: "visitor-hash",
      ipHash: "ip-hash",
    });

    expect(result).toEqual({ kind: "persistence-failed" });
  });

  it("rate-limits per ip_hash using its own engagement:reactions endpoint policy, independent of the views endpoint's budget (security: Rate limits are scoped per endpoint)", async () => {
    const deps = makeDeps();
    const now = new Date("2026-07-07T12:00:30.000Z");

    await recordArticleReaction(deps, {
      rawBody: { slug: "clean-architecture-nextjs", kind: "thumbs_up" },
      visitorHash: "visitor-hash",
      ipHash: "ip-hash",
      now,
    });

    expect(deps.rateLimitRepository.incrementAndGet).toHaveBeenCalledWith({
      endpoint: "engagement:reactions",
      key: "ip-hash",
      windowStart: new Date("2026-07-07T12:00:00.000Z"),
    });
  });
});
