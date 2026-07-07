import { checkRateLimit } from "@/shared/rate-limit/check-rate-limit";
import type { RateLimitRepository } from "@/shared/rate-limit/rate-limit-repository";
import type {
  ArticleReactionRepository,
  ReactionCounts,
} from "../domain/article-reaction-repository";
import type { ArticleSlugChecker } from "../domain/article-slug-checker";
import type { ArticleViewRepository } from "../domain/article-view-repository";

/**
 * Concrete per-endpoint policy for `GET /api/engagement/[slug]` — 60
 * requests/min, its own independent budget (security: Rate Limiting on
 * Write/Query Endpoints).
 */
const SUMMARY_RATE_LIMIT_POLICY = {
  endpoint: "engagement:summary",
  limit: 60,
  windowMs: 60 * 1000,
};

export type GetArticleEngagementSummaryResult =
  | { kind: "ok"; views: number; reactions: ReactionCounts }
  | { kind: "not-found" }
  | { kind: "rate-limited" }
  | { kind: "unavailable" };

export interface GetArticleEngagementSummaryDeps {
  articleViewRepository: ArticleViewRepository;
  articleReactionRepository: ArticleReactionRepository;
  rateLimitRepository: RateLimitRepository;
  articleSlugChecker: ArticleSlugChecker;
}

export interface GetArticleEngagementSummaryInput {
  slug: string;
  /** HMAC-SHA256(IP) — the rate-limiting key. */
  ipHash: string;
  now?: Date;
}

/**
 * Orchestrates the public aggregate-counts read (engagement: Public Read
 * of Aggregate Counts). Check order — rate limit -> unknown-slug
 * rejection -> counts read — mirrors the write use-cases'
 * rate-limit-first orchestration rule. Lives here (not the route
 * handler) so this branching is covered by the `src/**` coverage gate;
 * the route handler is solely responsible for the `Cache-Control`
 * header (an HTTP transport concern, not business logic).
 */
export async function getArticleEngagementSummary(
  deps: GetArticleEngagementSummaryDeps,
  input: GetArticleEngagementSummaryInput,
): Promise<GetArticleEngagementSummaryResult> {
  const now = input.now ?? new Date();

  const { limited } = await checkRateLimit(
    deps.rateLimitRepository,
    input.ipHash,
    SUMMARY_RATE_LIMIT_POLICY,
    now,
  );
  if (limited) {
    return { kind: "rate-limited" };
  }

  const isPublished = await deps.articleSlugChecker.isPublishedSlug(input.slug);
  if (!isPublished) {
    return { kind: "not-found" };
  }

  try {
    const [views, reactions] = await Promise.all([
      deps.articleViewRepository.countViews(input.slug),
      deps.articleReactionRepository.countReactionsByKind(input.slug),
    ]);

    return { kind: "ok", views, reactions };
  } catch {
    return { kind: "unavailable" };
  }
}
