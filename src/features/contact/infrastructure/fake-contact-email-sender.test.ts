import { describe, expect, it } from "vitest";
import { createFakeContactEmailSender } from "./fake-contact-email-sender";

describe("createFakeContactEmailSender", () => {
  it("resolves successfully without throwing (deterministic e2e/EMAIL_DRIVER=fake happy path)", async () => {
    const sender = createFakeContactEmailSender();

    await expect(
      sender.send({
        name: "Andrés Valencia",
        email: "andres@example.com",
        message: "Hello",
        locale: "es",
      }),
    ).resolves.toBeUndefined();
  });

  it("resolves for a second, different input (triangulation — no hidden per-call state)", async () => {
    const sender = createFakeContactEmailSender();

    await expect(
      sender.send({
        name: "Second Caller",
        email: "second@example.com",
        message: "Different message",
        locale: "en",
      }),
    ).resolves.toBeUndefined();
  });
});
