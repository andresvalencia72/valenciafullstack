import { describe, expect, it, vi } from "vitest";
import type { RateLimitRepository } from "@/shared/rate-limit/rate-limit-repository";
import type {
  ArticleSearchRepository,
  ArticleSearchResultRow,
} from "../domain/article-search-repository";
import { searchArticles } from "./search-articles";

function fakeRateLimitRepository(count: number): RateLimitRepository {
  return { incrementAndGet: vi.fn().mockResolvedValue(count) };
}

function fakeArticleSearchRepository(
  results: ArticleSearchResultRow[] = [],
): ArticleSearchRepository {
  return {
    reconcile: vi.fn().mockResolvedValue(undefined),
    search: vi.fn().mockResolvedValue(results),
  };
}

const RESULTS: ArticleSearchResultRow[] = [
  {
    slug: "clean-architecture-nextjs",
    locale: "es",
    title: "Arquitectura limpia",
    description: "Descripción",
    category: "architecture",
  },
];

describe("searchArticles", () => {
  it("returns 'ok' with results for a valid query under the rate limit", async () => {
    const articleSearchRepository = fakeArticleSearchRepository(RESULTS);

    const result = await searchArticles(
      {
        articleSearchRepository,
        rateLimitRepository: fakeRateLimitRepository(1),
      },
      { query: { q: "hexagonal", locale: "es" }, ipHash: "hash-1" },
    );

    expect(result).toEqual({ kind: "ok", results: RESULTS });
    expect(articleSearchRepository.search).toHaveBeenCalledWith("es", "hexagonal");
  });

  it("returns 'rate-limited' without querying the repository when over budget (search: Input Validation and Rate Limiting)", async () => {
    const articleSearchRepository = fakeArticleSearchRepository(RESULTS);

    const result = await searchArticles(
      {
        articleSearchRepository,
        rateLimitRepository: fakeRateLimitRepository(31),
      },
      { query: { q: "hexagonal", locale: "es" }, ipHash: "hash-1" },
    );

    expect(result).toEqual({ kind: "rate-limited" });
    expect(articleSearchRepository.search).not.toHaveBeenCalled();
  });

  it("returns 'invalid' for an oversized query without querying the repository (search: Oversized query rejected)", async () => {
    const articleSearchRepository = fakeArticleSearchRepository(RESULTS);

    const result = await searchArticles(
      {
        articleSearchRepository,
        rateLimitRepository: fakeRateLimitRepository(1),
      },
      { query: { q: "a".repeat(201), locale: "es" }, ipHash: "hash-1" },
    );

    expect(result).toEqual({ kind: "invalid" });
    expect(articleSearchRepository.search).not.toHaveBeenCalled();
  });

  it("returns 'invalid' for a locale outside es/en (search: Invalid locale rejected)", async () => {
    const articleSearchRepository = fakeArticleSearchRepository(RESULTS);

    const result = await searchArticles(
      {
        articleSearchRepository,
        rateLimitRepository: fakeRateLimitRepository(1),
      },
      { query: { q: "hexagonal", locale: "fr" }, ipHash: "hash-1" },
    );

    expect(result).toEqual({ kind: "invalid" });
  });

  it("returns 'unavailable' when the repository throws (search: Graceful Degradation When Database Unavailable)", async () => {
    const articleSearchRepository: ArticleSearchRepository = {
      reconcile: vi.fn(),
      search: vi.fn().mockRejectedValue(new Error("connection refused")),
    };

    const result = await searchArticles(
      {
        articleSearchRepository,
        rateLimitRepository: fakeRateLimitRepository(1),
      },
      { query: { q: "hexagonal", locale: "es" }, ipHash: "hash-1" },
    );

    expect(result).toEqual({ kind: "unavailable" });
  });

  it("returns 'ok' with an empty array for a query with no matches (search: No-Match Handling)", async () => {
    const articleSearchRepository = fakeArticleSearchRepository([]);

    const result = await searchArticles(
      {
        articleSearchRepository,
        rateLimitRepository: fakeRateLimitRepository(1),
      },
      { query: { q: "xyzzyplugh", locale: "en" }, ipHash: "hash-1" },
    );

    expect(result).toEqual({ kind: "ok", results: [] });
  });

  it("uses the 'search' endpoint as its own independent rate-limit key (security: Rate Limiting on Write/Query Endpoints)", async () => {
    const rateLimitRepository = fakeRateLimitRepository(1);

    await searchArticles(
      {
        articleSearchRepository: fakeArticleSearchRepository(RESULTS),
        rateLimitRepository,
      },
      { query: { q: "hexagonal", locale: "es" }, ipHash: "hash-1" },
    );

    expect(rateLimitRepository.incrementAndGet).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: "search", key: "hash-1" }),
    );
  });
});
