import { describe, expect, it, vi } from "vitest";
import type { ArticleReactionRepository } from "../domain/article-reaction-repository";
import type { ArticleSlugChecker } from "../domain/article-slug-checker";
import type { ArticleViewRepository } from "../domain/article-view-repository";
import {
  getArticleEngagementSummary,
  type GetArticleEngagementSummaryDeps,
} from "./get-article-engagement-summary";

function makeDeps(
  overrides: Partial<GetArticleEngagementSummaryDeps> = {},
): GetArticleEngagementSummaryDeps {
  return {
    articleViewRepository: {
      recordView: vi.fn(),
      countViews: vi.fn().mockResolvedValue(42),
    } satisfies ArticleViewRepository,
    articleReactionRepository: {
      recordReaction: vi.fn(),
      countReactionsByKind: vi.fn().mockResolvedValue({
        thumbs_up: 3,
        heart: 5,
        fire: 1,
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

describe("getArticleEngagementSummary", () => {
  it("returns the aggregate counts for a published slug with no visitor identifiers (engagement: Public Read of Aggregate Counts)", async () => {
    const deps = makeDeps();

    const result = await getArticleEngagementSummary(deps, {
      slug: "clean-architecture-nextjs",
      ipHash: "ip-hash",
    });

    expect(result).toEqual({
      kind: "ok",
      views: 42,
      reactions: { thumbs_up: 3, heart: 5, fire: 1 },
    });
  });

  it("returns 'not-found' for a slug outside the published article set (engagement: Unknown slug returns 404 on summary read)", async () => {
    const deps = makeDeps({
      articleSlugChecker: { isPublishedSlug: vi.fn().mockResolvedValue(false) },
    });

    const result = await getArticleEngagementSummary(deps, {
      slug: "does-not-exist",
      ipHash: "ip-hash",
    });

    expect(result).toEqual({ kind: "not-found" });
    expect(deps.articleViewRepository.countViews).not.toHaveBeenCalled();
  });

  it("returns 'rate-limited' and skips the slug check/counts when the ip_hash budget is exhausted (security: Rate Limiting on Write/Query Endpoints)", async () => {
    const deps = makeDeps({
      rateLimitRepository: { incrementAndGet: vi.fn().mockResolvedValue(61) },
    });

    const result = await getArticleEngagementSummary(deps, {
      slug: "clean-architecture-nextjs",
      ipHash: "ip-hash",
    });

    expect(result).toEqual({ kind: "rate-limited" });
    expect(deps.articleSlugChecker.isPublishedSlug).not.toHaveBeenCalled();
  });

  it("returns 'unavailable' when the view count read throws (engagement: Graceful Degradation When Database Unavailable)", async () => {
    const deps = makeDeps({
      articleViewRepository: {
        recordView: vi.fn(),
        countViews: vi.fn().mockRejectedValue(new Error("connection refused")),
      },
    });

    const result = await getArticleEngagementSummary(deps, {
      slug: "clean-architecture-nextjs",
      ipHash: "ip-hash",
    });

    expect(result).toEqual({ kind: "unavailable" });
  });

  it("returns 'unavailable' when the reaction count read throws (triangulation: the other repository)", async () => {
    const deps = makeDeps({
      articleReactionRepository: {
        recordReaction: vi.fn(),
        countReactionsByKind: vi.fn().mockRejectedValue(new Error("connection refused")),
      },
    });

    const result = await getArticleEngagementSummary(deps, {
      slug: "clean-architecture-nextjs",
      ipHash: "ip-hash",
    });

    expect(result).toEqual({ kind: "unavailable" });
  });

  it("rate-limits per ip_hash using its own engagement:summary policy, 60 requests/min (security: single source of truth for concrete limits)", async () => {
    const deps = makeDeps();
    const now = new Date("2026-07-07T12:00:30.000Z");

    await getArticleEngagementSummary(deps, {
      slug: "clean-architecture-nextjs",
      ipHash: "ip-hash",
      now,
    });

    expect(deps.rateLimitRepository.incrementAndGet).toHaveBeenCalledWith({
      endpoint: "engagement:summary",
      key: "ip-hash",
      windowStart: new Date("2026-07-07T12:00:00.000Z"),
    });
  });
});
