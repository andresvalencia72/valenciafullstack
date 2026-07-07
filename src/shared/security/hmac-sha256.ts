import { createHmac } from "node:crypto";

/**
 * HMAC-SHA256 hex digest of `value`, keyed by `secret` (security:
 * Hashed Visitor Keys, No Tracking Cookies — the `ip_hash`/`visitor_hash`
 * primitive). Deterministic for a given (value, secret) pair; rotating
 * the secret changes every digest, which is the intended way to reset
 * dedupe/rate-limit identity continuity (see design.md Persistence).
 */
export function hmacSha256Hex(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}
