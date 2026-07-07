import type { ContactEmailSender } from "../domain/contact-email-sender";

/**
 * `ContactEmailSender` implementation for `EMAIL_DRIVER=fake` — always
 * resolves, never calls a real email provider. Used in CI e2e (no real
 * Resend calls, per design.md's e2e environment strategy) and locally
 * when `RESEND_API_KEY` is unavailable but a deterministic "sent" happy
 * path is still needed for manual testing.
 */
export function createFakeContactEmailSender(): ContactEmailSender {
  return {
    async send() {
      // Intentional no-op.
    },
  };
}
