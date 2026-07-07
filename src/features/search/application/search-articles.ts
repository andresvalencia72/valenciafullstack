import { checkRateLimit } from "@/shared/rate-limit/check-rate-limit";
import type { RateLimitRepository } from "@/shared/rate-limit/rate-limit-repository";
import type {
  ArticleSearchRepository,
  ArticleSearchResultRow,
} from "../domain/article-search-repository";
import { searchQuerySchema } from "./search-query-schema";

/**
 * Concrete per-endpoint policy for `GET /api/search` — 30 requests/min,
 * its own independent budget (security spec table). Distinct from
 * `visitor_hash`-based dedupe used elsewhere; keyed by `ip_hash`.
 */
const SEARCH_RATE_LIMIT_POLICY = {
  endpoint: "search",
  limit: 30,
  windowMs: 60 * 1000,
};

export type SearchArticlesResult =
  | { kind: "ok"; results: ArticleSearchResultRow[] }
  | { kind: "invalid" }
  | { kind: "rate-limited" }
  | { kind: "unavailable" };

export interface SearchArticlesDeps {
  articleSearchRepository: ArticleSearchRepository;
  rateLimitRepository: RateLimitRepository;
}

export interface SearchArticlesInput {
  /** Raw, not-yet-validated `{ q, locale }` shape — validated inside
   * this use-case so the branching stays covered by the `src/**` gate
   * (design.md API Surface: orchestration logic MUST live in the
   * feature's `application` use-case, not the thin route handler). */
  query: unknown;
  /** HMAC-SHA256(IP) — the rate-limiting key. */
  ipHash: string;
  now?: Date;
}

/**
 * Orchestrates the search request (search: Full-Text Query, Input
 * Validation and Rate Limiting, Graceful Degradation When Database
 * Unavailable). Check order — rate limit -> validate -> query — mirrors
 * contact/engagement's rate-limit-first orchestration rule (see
 * tasks.md Implementation Notes: "Application-layer orchestration rule
 * (rate limit -> validation flow) applies to engagement and search
 * use-cases too").
 */
export async function searchArticles(
  deps: SearchArticlesDeps,
  input: SearchArticlesInput,
): Promise<SearchArticlesResult> {
  const now = input.now ?? new Date();

  const { limited } = await checkRateLimit(
    deps.rateLimitRepository,
    input.ipHash,
    SEARCH_RATE_LIMIT_POLICY,
    now,
  );
  if (limited) {
    return { kind: "rate-limited" };
  }

  const parsed = searchQuerySchema.safeParse(input.query);
  if (!parsed.success) {
    return { kind: "invalid" };
  }

  try {
    const results = await deps.articleSearchRepository.search(
      parsed.data.locale,
      parsed.data.q,
    );
    return { kind: "ok", results };
  } catch {
    return { kind: "unavailable" };
  }
}
