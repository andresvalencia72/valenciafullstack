import { checkRateLimit } from "@/shared/rate-limit/check-rate-limit";
import type { RateLimitRepository } from "@/shared/rate-limit/rate-limit-repository";
import type { ArticleSlugChecker } from "../domain/article-slug-checker";
import type { ArticleViewRepository } from "../domain/article-view-repository";
import type { EngagementWriteResult } from "./engagement-write-result";
import { viewRequestSchema } from "./view-request-schema";

/**
 * Concrete per-endpoint policy for `POST /api/engagement/views` — 20
 * requests/min, independent of the `reactions` endpoint's own 20/min
 * budget (security: Rate Limiting on Write/Query Endpoints — "each
 * endpoint maintains its own independent limit window").
 */
const VIEWS_RATE_LIMIT_POLICY = {
  endpoint: "engagement:views",
  limit: 20,
  windowMs: 60 * 1000,
};

export interface RecordArticleViewDeps {
  articleViewRepository: ArticleViewRepository;
  rateLimitRepository: RateLimitRepository;
  articleSlugChecker: ArticleSlugChecker;
}

export interface RecordArticleViewInput {
  /** Unparsed request body — validated internally. */
  rawBody: unknown;
  /** HMAC-SHA256(IP + user agent) — computed by the caller (route handler). */
  visitorHash: string;
  /** HMAC-SHA256(IP) — the rate-limiting key, distinct from `visitorHash`. */
  ipHash: string;
  now?: Date;
}

/**
 * Orchestrates a view recording end to end (engagement: View Counting
 * with Permanent Dedupe). Check order — rate limit -> validate ->
 * unknown-slug rejection -> persist — mirrors the contact spec's
 * "rate limit -> honeypot -> validation" ordering and the Implementation
 * Notes' explicit extension of that rule to engagement/search use-cases.
 * Lives here (not the route handler) so this branching is covered by
 * the `src/**` coverage gate.
 */
export async function recordArticleView(
  deps: RecordArticleViewDeps,
  input: RecordArticleViewInput,
): Promise<EngagementWriteResult> {
  const now = input.now ?? new Date();

  // 1. Rate limit, keyed by ip_hash — never visitor_hash (security:
  // Hashed Visitor Keys — the two hashes serve different purposes).
  const { limited } = await checkRateLimit(
    deps.rateLimitRepository,
    input.ipHash,
    VIEWS_RATE_LIMIT_POLICY,
    now,
  );
  if (limited) {
    return { kind: "rate-limited" };
  }

  // 2. Zod validation.
  const parsed = viewRequestSchema.safeParse(input.rawBody);
  if (!parsed.success) {
    return { kind: "invalid" };
  }

  // 3. Unknown-slug rejection (engagement: Endpoint Validation, Unknown
  // Slug Rejection).
  const isPublished = await deps.articleSlugChecker.isPublishedSlug(
    parsed.data.slug,
  );
  if (!isPublished) {
    return { kind: "not-found" };
  }

  // 4. Persist — insert-if-absent permanent dedupe. The use-case never
  // inspects the returned boolean: first write and repeat write both
  // map to the identical "recorded" outcome (204), per the engagement
  // spec's "the response never distinguishes the two cases".
  try {
    await deps.articleViewRepository.recordView(
      parsed.data.slug,
      input.visitorHash,
    );
  } catch {
    return { kind: "persistence-failed" };
  }

  return { kind: "recorded" };
}
