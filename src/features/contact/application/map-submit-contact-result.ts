import type { SubmitContactMessageResult } from "./submit-contact-message";

export interface ContactHttpResponse {
  status: number;
  body: Record<string, string>;
}

/**
 * Maps the use-case result to an HTTP status/body pair (security: No
 * PII or Internal Detail Leakage — every body below is a fixed,
 * generic literal, never derived from an error object). Kept in the
 * `application` layer (not the route handler) so this branching is
 * covered by the `src/**` coverage gate.
 */
export function mapSubmitContactResultToResponse(
  result: SubmitContactMessageResult,
): ContactHttpResponse {
  switch (result.kind) {
    case "sent":
    case "honeypot":
      // Byte-identical on purpose (contact: Spam Mitigation — a
      // honeypot hit must not signal detection to the bot).
      return { status: 200, body: { status: "sent" } };
    case "delayed":
      return {
        status: 202,
        body: { status: "received", message: "Delivery delayed." },
      };
    case "invalid":
      return {
        status: 400,
        body: { status: "invalid", message: "Invalid submission." },
      };
    case "rate-limited":
      return { status: 429, body: { status: "rate_limited" } };
    case "persistence-failed":
      return {
        status: 503,
        body: { status: "unavailable", message: "Please try again later." },
      };
  }
}
