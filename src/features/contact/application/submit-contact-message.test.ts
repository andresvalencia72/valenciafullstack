import { describe, expect, it } from "vitest";
import type {
  ContactMessageInput,
  ContactMessageRepository,
} from "../domain/contact-message-repository";
import type { ContactEmailSender } from "../domain/contact-email-sender";
import type {
  RateLimitCheckInput,
  RateLimitRepository,
} from "@/shared/rate-limit/rate-limit-repository";
import { submitContactMessage } from "./submit-contact-message";

const VALID_RAW_BODY = {
  name: "Andrés Valencia",
  email: "andres@example.com",
  message: "Hello from the contact form",
  locale: "es",
};

function createDeps(overrides?: {
  rateLimitCount?: number;
  saveError?: Error;
  emailError?: Error;
}) {
  const savedMessages: ContactMessageInput[] = [];
  const rateLimitCalls: RateLimitCheckInput[] = [];
  const sentEmails: unknown[] = [];

  const contactMessageRepository: ContactMessageRepository = {
    async save(input) {
      if (overrides?.saveError) {
        throw overrides.saveError;
      }
      savedMessages.push(input);
    },
  };

  const rateLimitRepository: RateLimitRepository = {
    async incrementAndGet(input) {
      rateLimitCalls.push(input);
      return overrides?.rateLimitCount ?? 1;
    },
  };

  const emailSender: ContactEmailSender = {
    async send(input) {
      if (overrides?.emailError) {
        throw overrides.emailError;
      }
      sentEmails.push(input);
    },
  };

  return {
    deps: { contactMessageRepository, rateLimitRepository, emailSender },
    savedMessages,
    rateLimitCalls,
    sentEmails,
  };
}

describe("submitContactMessage", () => {
  it("returns 'sent' and persists + emails on a fully valid submission (contact: Server-Side Input Validation)", async () => {
    const { deps, savedMessages, sentEmails } = createDeps();

    const result = await submitContactMessage(deps, {
      rawBody: VALID_RAW_BODY,
      ipHash: "hash-1",
    });

    expect(result).toEqual({ kind: "sent" });
    expect(savedMessages).toEqual([
      {
        name: "Andrés Valencia",
        email: "andres@example.com",
        message: "Hello from the contact form",
        locale: "es",
        ipHash: "hash-1",
      },
    ]);
    expect(sentEmails).toEqual([
      {
        name: "Andrés Valencia",
        email: "andres@example.com",
        message: "Hello from the contact form",
        locale: "es",
      },
    ]);
  });

  it("returns 'rate-limited' and skips persistence/email when the rate limit is exceeded (contact: Rate Limiting)", async () => {
    const { deps, savedMessages, sentEmails } = createDeps({ rateLimitCount: 4 });

    const result = await submitContactMessage(deps, {
      rawBody: VALID_RAW_BODY,
      ipHash: "hash-1",
    });

    expect(result).toEqual({ kind: "rate-limited" });
    expect(savedMessages).toEqual([]);
    expect(sentEmails).toEqual([]);
  });

  it("returns 'honeypot' and skips persistence/email, but still consumes rate-limit budget (contact: Spam Mitigation, check order)", async () => {
    const { deps, savedMessages, sentEmails, rateLimitCalls } = createDeps();

    const result = await submitContactMessage(deps, {
      rawBody: { ...VALID_RAW_BODY, company: "spambot inc" },
      ipHash: "hash-1",
    });

    expect(result).toEqual({ kind: "honeypot" });
    expect(savedMessages).toEqual([]);
    expect(sentEmails).toEqual([]);
    expect(rateLimitCalls).toHaveLength(1);
  });

  it("returns 'invalid' and skips persistence/email on a malformed payload (triangulation)", async () => {
    const { deps, savedMessages, sentEmails } = createDeps();

    const result = await submitContactMessage(deps, {
      rawBody: { ...VALID_RAW_BODY, email: "not-an-email" },
      ipHash: "hash-1",
    });

    expect(result).toEqual({ kind: "invalid" });
    expect(savedMessages).toEqual([]);
    expect(sentEmails).toEqual([]);
  });

  it("returns 'persistence-failed' and never attempts email when persistence throws (contact: Message Persistence Independent of Email Delivery)", async () => {
    const { deps, sentEmails } = createDeps({ saveError: new Error("db down") });

    const result = await submitContactMessage(deps, {
      rawBody: VALID_RAW_BODY,
      ipHash: "hash-1",
    });

    expect(result).toEqual({ kind: "persistence-failed" });
    expect(sentEmails).toEqual([]);
  });

  it("returns 'delayed' when persistence succeeds but email delivery fails (contact: Email service failure)", async () => {
    const { deps, savedMessages } = createDeps({ emailError: new Error("resend down") });

    const result = await submitContactMessage(deps, {
      rawBody: VALID_RAW_BODY,
      ipHash: "hash-1",
    });

    expect(result).toEqual({ kind: "delayed" });
    expect(savedMessages).toHaveLength(1);
  });

  it("increments the rate limit exactly once per submission attempt", async () => {
    const { deps, rateLimitCalls } = createDeps();

    await submitContactMessage(deps, { rawBody: VALID_RAW_BODY, ipHash: "hash-1" });

    expect(rateLimitCalls).toEqual([
      expect.objectContaining({ endpoint: "contact", key: "hash-1" }),
    ]);
  });
});
