import type { ContactEmailSender } from "../domain/contact-email-sender";

/**
 * `ContactEmailSender` implementation used when email delivery has no
 * usable configuration (missing `RESEND_API_KEY` and/or
 * `CONTACT_EMAIL_TO`). Always rejects, so `submitContactMessage`
 * treats it identically to any other delivery failure — degrading to
 * a success-shaped HTTP 202 (contact: Email service not configured).
 */
export function createUnconfiguredContactEmailSender(): ContactEmailSender {
  return {
    async send() {
      throw new Error("Contact email sender is not configured.");
    },
  };
}
