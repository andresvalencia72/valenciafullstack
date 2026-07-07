/**
 * Storage-agnostic fixed-window rate-limit counter (persistence:
 * Infrastructure Repository Implementations; security: Rate Limiting).
 * Zero drizzle-orm/database imports.
 *
 * Deliberately placed under `shared/rate-limit/` rather than one
 * feature's `domain/` — the `rate_limits` table is cross-cutting
 * (contact, engagement, and search each enforce their own independent
 * per-endpoint limit against the same table, see security spec), so a
 * single shared repository avoids duplicating identical Drizzle upsert
 * logic three times. This mirrors `shared/db`'s existing role as the
 * home for cross-feature persistence primitives (see PR5b apply
 * findings for the full rationale).
 */
export interface RateLimitCheckInput {
  /** Logical endpoint name, e.g. "contact", "engagement:views". */
  endpoint: string;
  /** `ip_hash` — HMAC-SHA256 of the client IP. */
  key: string;
  /** Start of the current fixed window (caller computes the window boundary). */
  windowStart: Date;
}

export interface RateLimitRepository {
  /**
   * Atomically increments (or creates) the counter for this
   * (endpoint, key, windowStart) and returns the new count — a single
   * `INSERT ... ON CONFLICT ... DO UPDATE SET count = count + 1
   * RETURNING count` upsert, per design.md Persistence.
   */
  incrementAndGet(input: RateLimitCheckInput): Promise<number>;
}
