import type { RateLimitRepository } from "./rate-limit-repository";

/**
 * A per-endpoint fixed-window rate-limit policy (security: Rate Limiting
 * on Write/Query Endpoints — this spec is the single source of truth
 * for concrete per-endpoint limits).
 */
export interface RateLimitPolicy {
  endpoint: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitCheckOutcome {
  limited: boolean;
  count: number;
}

/**
 * Computes the current fixed-window boundary for `now` and atomically
 * increments the counter via the injected `RateLimitRepository`,
 * shared by every rate-limited feature's application-layer
 * orchestration (contact, and later engagement/search) — avoids
 * re-deriving the same window-boundary math three times, mirroring
 * PR5b's rationale for placing `RateLimitRepository` under
 * `shared/rate-limit/` in the first place.
 */
export async function checkRateLimit(
  repository: RateLimitRepository,
  key: string,
  policy: RateLimitPolicy,
  now: Date = new Date(),
): Promise<RateLimitCheckOutcome> {
  const windowStart = new Date(
    Math.floor(now.getTime() / policy.windowMs) * policy.windowMs,
  );

  const count = await repository.incrementAndGet({
    endpoint: policy.endpoint,
    key,
    windowStart,
  });

  return { limited: count > policy.limit, count };
}
