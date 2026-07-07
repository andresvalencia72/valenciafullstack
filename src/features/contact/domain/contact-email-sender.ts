/**
 * Storage-agnostic contact email notification port (domain: repository/
 * port interface). Zero imports — enforced structurally by
 * eslint-plugin-boundaries' `domain: allow: []` rule, which denies
 * `domain` files ANY import, including same-feature sibling domain
 * files (per PR5b's findings). `ContactLocale` is therefore duplicated
 * verbatim from `contact-message-repository.ts` rather than imported —
 * same rationale as `blog`'s `ArticleLocale` duplication (PR4). Real
 * `ContactLocale`-typed values from either file satisfy the other with
 * zero conversion. `infrastructure/` hosts every concrete sender
 * (Resend, fake, unconfigured).
 */
type ContactLocale = "es" | "en";

export interface ContactEmailInput {
  name: string;
  email: string;
  message: string;
  locale: ContactLocale;
}

export interface ContactEmailSender {
  /**
   * Sends a notification email for a validated contact submission.
   * MUST throw/reject on any delivery failure — the caller (application
   * use-case) treats a rejection as "delivery delayed" (contact:
   * Message Persistence Independent of Email Delivery), never as a
   * persistence failure.
   */
  send(input: ContactEmailInput): Promise<void>;
}
