import { checkRateLimit } from "@/shared/rate-limit/check-rate-limit";
import type { RateLimitRepository } from "@/shared/rate-limit/rate-limit-repository";
import type { ContactEmailSender } from "../domain/contact-email-sender";
import type { ContactMessageRepository } from "../domain/contact-message-repository";
import {
  contactSubmissionSchema,
  isHoneypotTriggered,
} from "./contact-submission-schema";

/**
 * Concrete per-endpoint policy for `POST /api/contact` — 3 requests /
 * 10 minutes, per the `security` capability's single source of truth
 * for concrete limits.
 */
const CONTACT_RATE_LIMIT_POLICY = {
  endpoint: "contact",
  limit: 3,
  windowMs: 10 * 60 * 1000,
};

export type SubmitContactMessageResult =
  | { kind: "sent" }
  | { kind: "delayed" }
  | { kind: "honeypot" }
  | { kind: "invalid" }
  | { kind: "rate-limited" }
  | { kind: "persistence-failed" };

export interface SubmitContactMessageDeps {
  contactMessageRepository: ContactMessageRepository;
  rateLimitRepository: RateLimitRepository;
  emailSender: ContactEmailSender;
}

export interface SubmitContactMessageInput {
  /** Unparsed request body — validated internally, after the honeypot check. */
  rawBody: unknown;
  /** HMAC-SHA256(requester IP) — computed by the caller (route handler). */
  ipHash: string;
  now?: Date;
}

/**
 * Orchestrates a contact submission end to end (contact: check-order
 * note — "rate limit -> honeypot -> validation ... MUST be implemented
 * in the contact feature's application layer, not the route handler").
 * Lives here specifically so this branching logic is covered by the
 * `src/**` coverage gate rather than the excluded `app/` route-adapter
 * layer.
 */
export async function submitContactMessage(
  deps: SubmitContactMessageDeps,
  input: SubmitContactMessageInput,
): Promise<SubmitContactMessageResult> {
  const now = input.now ?? new Date();

  // 1. Rate limit — always incremented first, even for honeypot/invalid
  // hits (contact spec: "a request that trips the honeypot still
  // consumes rate-limit budget").
  const { limited } = await checkRateLimit(
    deps.rateLimitRepository,
    input.ipHash,
    CONTACT_RATE_LIMIT_POLICY,
    now,
  );
  if (limited) {
    return { kind: "rate-limited" };
  }

  // 2. Honeypot — silently reject, response mapped identically to
  // success (contact: Spam Mitigation).
  if (isHoneypotTriggered(input.rawBody)) {
    return { kind: "honeypot" };
  }

  // 3. Zod validation.
  const parsed = contactSubmissionSchema.safeParse(input.rawBody);
  if (!parsed.success) {
    return { kind: "invalid" };
  }

  // 4. Persist — HTTP 503 is reserved for this failure only.
  try {
    await deps.contactMessageRepository.save({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
      locale: parsed.data.locale,
      ipHash: input.ipHash,
    });
  } catch {
    return { kind: "persistence-failed" };
  }

  // 5. Email — persistence already succeeded, so any failure here
  // degrades to a success-shaped 202, never a 503 (contact: Message
  // Persistence Independent of Email Delivery).
  try {
    await deps.emailSender.send({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
      locale: parsed.data.locale,
    });
  } catch {
    return { kind: "delayed" };
  }

  return { kind: "sent" };
}
