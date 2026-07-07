import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetEnvCacheForTests } from "@/shared/config/env";

const sendMock = vi.fn();

vi.mock("resend", () => {
  class FakeResend {
    apiKey: string;
    emails: { send: typeof sendMock };
    constructor(apiKey: string) {
      this.apiKey = apiKey;
      this.emails = { send: sendMock };
    }
  }
  return { Resend: vi.fn(FakeResend) };
});

const { createContactEmailSender } = await import("./create-contact-email-sender");
const { Resend } = await import("resend");

const REQUIRED_ENV = {
  DATABASE_URL: "postgres://user:pass@localhost:5432/db",
  VISITOR_HASH_SECRET: "test-secret",
};

describe("createContactEmailSender", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    __resetEnvCacheForTests();
    process.env = { ...originalEnv, ...REQUIRED_ENV };
    delete process.env.RESEND_API_KEY;
    delete process.env.CONTACT_EMAIL_TO;
    delete process.env.EMAIL_DRIVER;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    __resetEnvCacheForTests();
  });

  it("returns a fake sender that always resolves when EMAIL_DRIVER='fake' (deterministic e2e path)", async () => {
    process.env.EMAIL_DRIVER = "fake";
    process.env.RESEND_API_KEY = "should-be-ignored";
    process.env.CONTACT_EMAIL_TO = "owner@example.com";

    const sender = createContactEmailSender();

    await expect(
      sender.send({
        name: "Andrés Valencia",
        email: "andres@example.com",
        message: "Hello",
        locale: "es",
      }),
    ).resolves.toBeUndefined();
  });

  it("returns a sender that always rejects when RESEND_API_KEY is absent (triangulation — contact: Email service not configured)", async () => {
    delete process.env.RESEND_API_KEY;
    process.env.CONTACT_EMAIL_TO = "owner@example.com";

    const sender = createContactEmailSender();

    await expect(
      sender.send({
        name: "Andrés Valencia",
        email: "andres@example.com",
        message: "Hello",
        locale: "es",
      }),
    ).rejects.toThrow();
  });

  it("returns a sender that always rejects when CONTACT_EMAIL_TO is absent even if RESEND_API_KEY is set", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    delete process.env.CONTACT_EMAIL_TO;

    const sender = createContactEmailSender();

    await expect(
      sender.send({
        name: "Andrés Valencia",
        email: "andres@example.com",
        message: "Hello",
        locale: "es",
      }),
    ).rejects.toThrow();
  });

  it("returns a real Resend-backed sender, constructed with the configured API key, when both RESEND_API_KEY and CONTACT_EMAIL_TO are set", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.CONTACT_EMAIL_TO = "owner@example.com";
    sendMock.mockResolvedValueOnce({ data: { id: "email-1" }, error: null });

    const sender = createContactEmailSender();
    await sender.send({
      name: "Andrés Valencia",
      email: "andres@example.com",
      message: "Hello",
      locale: "es",
    });

    expect(Resend).toHaveBeenCalledWith("re_test_key");
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "owner@example.com",
        replyTo: "andres@example.com",
      }),
    );
  });
});
