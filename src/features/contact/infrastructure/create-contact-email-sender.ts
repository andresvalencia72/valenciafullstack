import { Resend } from "resend";
import { getEnv } from "@/shared/config/env";
import type { ContactEmailSender } from "../domain/contact-email-sender";
import { createFakeContactEmailSender } from "./fake-contact-email-sender";
import { createResendContactEmailSender } from "./resend-contact-email-sender";
import { createUnconfiguredContactEmailSender } from "./unconfigured-contact-email-sender";

/**
 * Env-driven `ContactEmailSender` factory (contact: Email service not
 * configured / Email service failure — the whole point of this factory
 * is to make every degraded case route to a sender that rejects, so
 * `submitContactMessage`'s single try/catch around `emailSender.send()`
 * covers all of them uniformly). Reads `getEnv()` — only `infrastructure`
 * (not `application`) may import `shared/config`, per boundary rules.
 */
export function createContactEmailSender(): ContactEmailSender {
  const env = getEnv();

  if (env.EMAIL_DRIVER === "fake") {
    return createFakeContactEmailSender();
  }

  if (!env.RESEND_API_KEY || !env.CONTACT_EMAIL_TO) {
    return createUnconfiguredContactEmailSender();
  }

  return createResendContactEmailSender({
    client: new Resend(env.RESEND_API_KEY),
    to: env.CONTACT_EMAIL_TO,
    from: env.CONTACT_EMAIL_FROM,
  });
}
