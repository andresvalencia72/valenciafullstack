/**
 * Storage-agnostic contact-message persistence (domain: repository
 * interface, persistence: Domain Repository Interfaces). Zero
 * drizzle-orm/database imports — enforced structurally by
 * eslint-plugin-boundaries' `domain: allow: []` rule (see
 * eslint.config.mjs), which denies this file ANY import at all.
 * `infrastructure/drizzle-contact-message-repository.ts` is the
 * Drizzle-backed implementation.
 */
export type ContactLocale = "es" | "en";

export interface ContactMessageInput {
  name: string;
  email: string;
  message: string;
  locale: ContactLocale;
  /** HMAC-SHA256(requester IP) — never the raw IP, see schema.ts. */
  ipHash: string;
}

export interface ContactMessageRepository {
  /** Persists a validated contact submission. */
  save(input: ContactMessageInput): Promise<void>;
}
