import type { ContactEmailSender } from "../domain/contact-email-sender";

/**
 * Minimal structural shape of the Resend SDK client actually used here
 * — decouples this module from the concrete `Resend` class so tests
 * can inject a fake without loading the real SDK. A real `new
 * Resend(apiKey)` instance satisfies this shape (same factory-injection
 * pattern as `createDrizzle*Repository(db)`).
 */
export interface ResendClientLike {
  emails: {
    send(payload: {
      from: string;
      to: string;
      replyTo: string;
      subject: string;
      text: string;
    }): Promise<{ data: unknown; error: { message: string } | null }>;
  };
}

export interface CreateResendContactEmailSenderOptions {
  client: ResendClientLike;
  to: string;
  from: string;
}

/**
 * `ContactEmailSender` implementation backed by the real Resend API
 * (contact: Valid submission — "an email notification MUST be sent via
 * the configured email service"). `replyTo` is the visitor's own
 * address, so replying to the notification email reaches them directly.
 */
export function createResendContactEmailSender(
  options: CreateResendContactEmailSenderOptions,
): ContactEmailSender {
  return {
    async send(input) {
      const { error } = await options.client.emails.send({
        from: options.from,
        to: options.to,
        replyTo: input.email,
        subject: `New contact message from ${input.name}`,
        text: `${input.message}\n\n— ${input.name} <${input.email}> (${input.locale})`,
      });

      if (error) {
        throw new Error(error.message);
      }
    },
  };
}
