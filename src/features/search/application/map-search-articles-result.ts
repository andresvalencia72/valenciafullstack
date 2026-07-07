import type { SearchArticlesResult } from "./search-articles";

export interface SearchArticlesHttpResponse {
  status: number;
  body: unknown;
}

/**
 * Maps the search use-case result to an HTTP status/body pair (search:
 * Full-Text Query, No-Match Handling, Graceful Degradation When
 * Database Unavailable). Each result item gets a locale-prefixed `url`
 * so the client can render a direct link without recomputing routing
 * rules.
 */
export function mapSearchArticlesResultToResponse(
  result: SearchArticlesResult,
): SearchArticlesHttpResponse {
  switch (result.kind) {
    case "ok":
      return {
        status: 200,
        body: {
          results: result.results.map((row) => ({
            slug: row.slug,
            title: row.title,
            description: row.description,
            category: row.category,
            locale: row.locale,
            url: `/${row.locale}/blog/${row.slug}`,
          })),
        },
      };
    case "invalid":
      return { status: 400, body: { status: "invalid" } };
    case "rate-limited":
      return { status: 429, body: { status: "rate_limited" } };
    case "unavailable":
      return { status: 503, body: { status: "unavailable" } };
  }
}
