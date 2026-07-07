import { checkRateLimit } from "@/shared/rate-limit/check-rate-limit";
import type { RateLimitRepository } from "@/shared/rate-limit/rate-limit-repository";
import type { ArticleReactionRepository } from "../domain/article-reaction-repository";
import type { ArticleSlugChecker } from "../domain/article-slug-checker";
import type { EngagementWriteResult } from "./engagement-write-result";
import { reactionRequestSchema } from "./reaction-request-schema";

/**
 * Concrete per-endpoint policy for `POST /api/engagement/reactions` — 20
 * requests/min, its own independent budget from the `views` endpoint
 * (security: Rate Limiting on Write/Query Endpoints).
 */
const REACTIONS_RATE_LIMIT_POLICY = {
  endpoint: "engagement:reactions",
  limit: 20,
  windowMs: 60 * 1000,
};

export interface RecordArticleReactionDeps {
  articleReactionRepository: ArticleReactionRepository;
  rateLimitRepository: RateLimitRepository;
  articleSlugChecker: ArticleSlugChecker;
}

export interface RecordArticleReactionInput {
  /** Unparsed request body — validated internally. */
  rawBody: unknown;
  /** HMAC-SHA256(IP + user agent) — computed by the caller (route handler). */
  visitorHash: string;
  /** HMAC-SHA256(IP) — the rate-limiting key, distinct from `visitorHash`. */
  ipHash: string;
  now?: Date;
}

/**
 * Orchestrates a reaction recording end to end (engagement: Reactions
 * with Permanent Dedupe). Same check order as `recordArticleView` —
 * rate limit -> validate (incl. the fixed reaction-kind enum) ->
 * unknown-slug rejection -> persist. Lives here (not the route handler)
 * so this branching is covered by the `src/**` coverage gate.
 */
export async function recordArticleReaction(
  deps: RecordArticleReactionDeps,
  input: RecordArticleReactionInput,
): Promise<EngagementWriteResult> {
  const now = input.now ?? new Date();

  const { limited } = await checkRateLimit(
    deps.rateLimitRepository,
    input.ipHash,
    REACTIONS_RATE_LIMIT_POLICY,
    now,
  );
  if (limited) {
    return { kind: "rate-limited" };
  }

  const parsed = reactionRequestSchema.safeParse(input.rawBody);
  if (!parsed.success) {
    return { kind: "invalid" };
  }

  const isPublished = await deps.articleSlugChecker.isPublishedSlug(
    parsed.data.slug,
  );
  if (!isPublished) {
    return { kind: "not-found" };
  }

  try {
    await deps.articleReactionRepository.recordReaction(
      parsed.data.slug,
      input.visitorHash,
      parsed.data.kind,
    );
  } catch {
    return { kind: "persistence-failed" };
  }

  return { kind: "recorded" };
}
