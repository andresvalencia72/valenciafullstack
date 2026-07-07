import { describe, expect, it } from "vitest";
import type { ArticleSearchResultRow } from "../domain/article-search-repository";
import { mapSearchArticlesResultToResponse } from "./map-search-articles-result";
import type { SearchArticlesResult } from "./search-articles";

const ROW: ArticleSearchResultRow = {
  slug: "clean-architecture-nextjs",
  locale: "es",
  title: "Arquitectura limpia",
  description: "Descripción",
  category: "architecture",
};

describe("mapSearchArticlesResultToResponse", () => {
  it("maps 'ok' to 200 with a mapped results array including a locale-prefixed url", () => {
    const result: SearchArticlesResult = { kind: "ok", results: [ROW] };

    const response = mapSearchArticlesResultToResponse(result);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      results: [
        {
          slug: "clean-architecture-nextjs",
          title: "Arquitectura limpia",
          description: "Descripción",
          category: "architecture",
          locale: "es",
          url: "/es/blog/clean-architecture-nextjs",
        },
      ],
    });
  });

  it("maps 'ok' with zero results to 200 with an empty array (search: No-Match Handling)", () => {
    const result: SearchArticlesResult = { kind: "ok", results: [] };

    const response = mapSearchArticlesResultToResponse(result);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ results: [] });
  });

  it("maps 'invalid' to 400", () => {
    const response = mapSearchArticlesResultToResponse({ kind: "invalid" });

    expect(response.status).toBe(400);
  });

  it("maps 'rate-limited' to 429", () => {
    const response = mapSearchArticlesResultToResponse({ kind: "rate-limited" });

    expect(response.status).toBe(429);
  });

  it("maps 'unavailable' to 503 (search: Graceful Degradation When Database Unavailable)", () => {
    const response = mapSearchArticlesResultToResponse({ kind: "unavailable" });

    expect(response.status).toBe(503);
  });
});
