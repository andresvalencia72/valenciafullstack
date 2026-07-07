import { z } from "zod";

/**
 * Hidden decoy field name (contact: Spam Mitigation). Any non-empty
 * value here means an automated filler touched a field a human never
 * sees — checked BEFORE Zod validation, per the check-order requirement
 * (rate limit -> honeypot -> validation).
 */
export const HONEYPOT_FIELD_NAME = "company";

/**
 * Server-side validation contract (contact: Server-Side Input
 * Validation). `locale` is client-submitted and validated as an enum,
 * not derived from the request — the client always knows which locale
 * it rendered the form in.
 */
export const contactSubmissionSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(254),
  message: z.string().min(1).max(5000),
  locale: z.enum(["es", "en"]),
});

export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;

/**
 * Lenient, non-throwing honeypot check on the raw request body — it
 * intentionally does NOT run full schema validation, since it must
 * execute before that validation step per the check-order requirement.
 * A malformed payload (wrong types, missing fields) must still be able
 * to trip the honeypot.
 */
export function isHoneypotTriggered(rawBody: unknown): boolean {
  if (typeof rawBody !== "object" || rawBody === null) {
    return false;
  }

  const value = (rawBody as Record<string, unknown>)[HONEYPOT_FIELD_NAME];
  return typeof value === "string" && value.trim().length > 0;
}
