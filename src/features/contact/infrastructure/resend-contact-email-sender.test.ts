import { describe, expect, it } from "vitest";
import type { ResendClientLike } from "./resend-contact-email-sender";
import { createResendContactEmailSender } from "./resend-contact-email-sender";

function createFakeResendClient(
  response: { error: { message: string } | null },
) {
  const calls: unknown[] = [];
  const client: ResendClientLike = {
    emails: {
      async send(payload) {
        calls.push(payload);
        return { data: response.error ? null : { id: "email-1" }, error: response.error };
      },
    },
  };
  return { client, calls };
}

describe("createResendContactEmailSender", () => {
  it("resolves when the Resend API reports no error (contact: Valid submission)", async () => {
    const { client, calls } = createFakeResendClient({ error: null });
    const sender = createResendContactEmailSender({
      client,
      to: "owner@example.com",
      from: "Portfolio Contact <onboarding@resend.dev>",
    });

    await expect(
      sender.send({
        name: "Andrés Valencia",
        email: "andres@example.com",
        message: "Hello from the contact form",
        locale: "es",
      }),
    ).resolves.toBeUndefined();

    expect(calls).toEqual([
      expect.objectContaining({
        to: "owner@example.com",
        from: "Portfolio Contact <onboarding@resend.dev>",
        replyTo: "andres@example.com",
      }),
    ]);
  });

  it("rejects when the Resend API reports an error (triangulation — contact: Email service failure)", async () => {
    const { client } = createFakeResendClient({
      error: { message: "domain not verified" },
    });
    const sender = createResendContactEmailSender({
      client,
      to: "owner@example.com",
      from: "Portfolio Contact <onboarding@resend.dev>",
    });

    await expect(
      sender.send({
        name: "Andrés Valencia",
        email: "andres@example.com",
        message: "Hello",
        locale: "en",
      }),
    ).rejects.toThrow("domain not verified");
  });
});
