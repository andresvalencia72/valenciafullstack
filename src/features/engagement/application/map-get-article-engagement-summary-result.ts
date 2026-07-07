import type { ReactionCounts } from "../domain/article-reaction-repository";
import type { GetArticleEngagementSummaryResult } from "./get-article-engagement-summary";

export interface EngagementSummaryHttpResponse {
  status: number;
  body: { views: number; reactions: ReactionCounts } | Record<string, string> | null;
  /** Set only on a 200 — 4xx/5xx responses MUST NOT be cacheable. */
  cacheControl?: string;
}

const PUBLIC_CACHE_CONTROL = "public, s-maxage=60";

/**
 * Maps the summary-read use-case result to an HTTP status/body/cache
 * triple (engagement: Public Read of Aggregate Counts, Error responses
 * are never cached). No visitor identifiers ever appear in the body.
 */
export function mapGetArticleEngagementSummaryResultToResponse(
  result: GetArticleEngagementSummaryResult,
): EngagementSummaryHttpResponse {
  switch (result.kind) {
    case "ok":
      return {
        status: 200,
        body: { views: result.views, reactions: result.reactions },
        cacheControl: PUBLIC_CACHE_CONTROL,
      };
    case "not-found":
      return { status: 404, body: { status: "not_found" } };
    case "rate-limited":
      return { status: 429, body: { status: "rate_limited" } };
    case "unavailable":
      return { status: 503, body: { status: "unavailable" } };
  }
}
