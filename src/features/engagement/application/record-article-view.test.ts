import { describe, expect, it, vi } from "vitest";
import type { ArticleViewRepository } from "../domain/article-view-repository";
import type { ArticleSlugChecker } from "../domain/article-slug-checker";
import {
  recordArticleView,
  type RecordArticleViewDeps,
} from "./record-article-view";

function makeDeps(overrides: Partial<RecordArticleViewDeps> = {}): RecordArticleViewDeps {
  return {
    articleViewRepository: {
      recordView: vi.fn().mockResolvedValue(true),
      countViews: vi.fn().mockResolvedValue(0),
    } satisfies ArticleViewRepository,
    rateLimitRepository: {
      incrementAndGet: vi.fn().mockResolvedValue(1),
    },
    articleSlugChecker: {
      isPublishedSlug: vi.fn().mockResolvedValue(true),
    } satisfies ArticleSlugChecker,
    ...overrides,
  };
}

describe("recordArticleView", () => {
  it("records a first view and returns 'recorded' (engagement: View Counting with Permanent Dedupe — first view)", async () => {
    const deps = makeDeps();

    const result = await recordArticleView(deps, {
      rawBody: { slug: "clean-architecture-nextjs" },
      visitorHash: "visitor-hash",
      ipHash: "ip-hash",
    });

    expect(result).toEqual({ kind: "recorded" });
    expect(deps.articleViewRepository.recordView).toHaveBeenCalledWith(
      "clean-architecture-nextjs",
      "visitor-hash",
    );
  });

  it("returns 'recorded' for a repeat view too — the use-case never distinguishes first vs. duplicate (engagement: idempotent 204, triangulation)", async () => {
    const deps = makeDeps({
      articleViewRepository: {
        recordView: vi.fn().mockResolvedValue(false),
        countViews: vi.fn().mockResolvedValue(3),
      },
    });

    const result = await recordArticleView(deps, {
      rawBody: { slug: "clean-architecture-nextjs" },
      visitorHash: "visitor-hash",
      ipHash: "ip-hash",
    });

    expect(result).toEqual({ kind: "recorded" });
  });

  it("returns 'invalid' for a malformed body without touching the repository or slug checker (security: Input Validation on Every Endpoint)", async () => {
    const deps = makeDeps();

    const result = await recordArticleView(deps, {
      rawBody: { slug: "" },
      visitorHash: "visitor-hash",
      ipHash: "ip-hash",
    });

    expect(result).toEqual({ kind: "invalid" });
    expect(deps.articleSlugChecker.isPublishedSlug).not.toHaveBeenCalled();
    expect(deps.articleViewRepository.recordView).not.toHaveBeenCalled();
  });

  it("returns 'not-found' for a slug outside the published article set (engagement: Unknown slug rejected)", async () => {
    const deps = makeDeps({
      articleSlugChecker: { isPublishedSlug: vi.fn().mockResolvedValue(false) },
    });

    const result = await recordArticleView(deps, {
      rawBody: { slug: "does-not-exist" },
      visitorHash: "visitor-hash",
      ipHash: "ip-hash",
    });

    expect(result).toEqual({ kind: "not-found" });
    expect(deps.articleViewRepository.recordView).not.toHaveBeenCalled();
  });

  it("returns 'rate-limited' and skips validation/persistence entirely when the ip_hash budget is exhausted (security: Rate Limiting on Write/Query Endpoints)", async () => {
    const deps = makeDeps({
      rateLimitRepository: { incrementAndGet: vi.fn().mockResolvedValue(21) },
    });

    const result = await recordArticleView(deps, {
      rawBody: { slug: "clean-architecture-nextjs" },
      visitorHash: "visitor-hash",
      ipHash: "ip-hash",
    });

    expect(result).toEqual({ kind: "rate-limited" });
    expect(deps.articleSlugChecker.isPublishedSlug).not.toHaveBeenCalled();
    expect(deps.articleViewRepository.recordView).not.toHaveBeenCalled();
  });

  it("returns 'persistence-failed' when the repository write throws (engagement: Graceful Degradation When Database Unavailable)", async () => {
    const deps = makeDeps({
      articleViewRepository: {
        recordView: vi.fn().mockRejectedValue(new Error("connection refused")),
        countViews: vi.fn(),
      },
    });

    const result = await recordArticleView(deps, {
      rawBody: { slug: "clean-architecture-nextjs" },
      visitorHash: "visitor-hash",
      ipHash: "ip-hash",
    });

    expect(result).toEqual({ kind: "persistence-failed" });
  });

  it("rate-limits per ip_hash using the engagement:views endpoint policy, 20 requests/min (security: single source of truth for concrete limits)", async () => {
    const deps = makeDeps();
    const now = new Date("2026-07-07T12:00:30.000Z");

    await recordArticleView(deps, {
      rawBody: { slug: "clean-architecture-nextjs" },
      visitorHash: "visitor-hash",
      ipHash: "ip-hash",
      now,
    });

    expect(deps.rateLimitRepository.incrementAndGet).toHaveBeenCalledWith({
      endpoint: "engagement:views",
      key: "ip-hash",
      windowStart: new Date("2026-07-07T12:00:00.000Z"),
    });
  });
});
