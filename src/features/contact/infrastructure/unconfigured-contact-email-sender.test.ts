import { describe, expect, it } from "vitest";
import { createUnconfiguredContactEmailSender } from "./unconfigured-contact-email-sender";

describe("createUnconfiguredContactEmailSender", () => {
  it("always rejects (contact: Email service not configured -> use-case degrades to 202)", async () => {
    const sender = createUnconfiguredContactEmailSender();

    await expect(
      sender.send({
        name: "Andrés Valencia",
        email: "andres@example.com",
        message: "Hello",
        locale: "es",
      }),
    ).rejects.toThrow();
  });

  it("rejects for a second, different input too (triangulation)", async () => {
    const sender = createUnconfiguredContactEmailSender();

    await expect(
      sender.send({
        name: "Second",
        email: "second@example.com",
        message: "Another message",
        locale: "en",
      }),
    ).rejects.toThrow();
  });
});
