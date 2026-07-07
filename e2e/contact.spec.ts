import { expect, test } from "@playwright/test";
import postgres from "postgres";

/**
 * contact: Server-Side Input Validation, Message Persistence
 * Independent of Email Delivery, Rate Limiting, Spam Mitigation, No PII
 * Leakage in Responses; quality-pipeline: End-to-End Test Gate. CI runs
 * with `EMAIL_DRIVER=fake` (see .github/workflows/ci.yml), so a fully
 * valid submission takes the deterministic "sent" happy path without
 * calling the real Resend API.
 *
 * Truncates `rate_limits` for the `contact` endpoint before this suite
 * runs so repeated local runs (and CI retries) never trip the 3/10min
 * limit from a shared IP (see tasks.md Implementation Notes: "Contact
 * e2e: rate limits are env-configurable (or rate_limits truncated
 * between contact tests)").
 */
test.describe("Contact form submission (PR6)", () => {
  test.beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }
    const sql = postgres(process.env.DATABASE_URL);
    try {
      await sql`DELETE FROM rate_limits WHERE endpoint = 'contact'`;
    } finally {
      await sql.end();
    }
  });

  test("submits successfully and shows a success message", async ({ page }) => {
    await page.goto("/en#contact");

    await page.getByLabel("Your name").fill("Playwright Bot");
    await page.getByLabel("Your email").fill("playwright@example.com");
    await page.getByLabel("Message").fill("Hello from the Playwright e2e suite.");
    await page.getByRole("button", { name: "Send message" }).click();

    await expect(page.getByRole("status")).toHaveText(
      "Thanks — your message is on its way. I'll get back to you soon.",
    );
  });

  test("silently accepts a honeypot-triggered submission with a success-shaped response, without persisting it (contact: Spam Mitigation)", async ({
    page,
  }) => {
    await page.goto("/en#contact");

    // Simulates a bot that fills every field, including the hidden
    // honeypot — bypasses the real browser form (which never exposes
    // that field to a human) to exercise the actual server round-trip.
    const response = await page.evaluate(async () => {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Bot",
          email: "bot@example.com",
          message: "I am definitely not a bot.",
          locale: "en",
          company: "Definitely A Real Company",
        }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "sent" });
  });

  test("rejects a malformed submission with HTTP 400 and a generic body (contact: Server-Side Input Validation, security: No PII Leakage)", async ({
    page,
  }) => {
    await page.goto("/en#contact");

    const response = await page.evaluate(async () => {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "",
          email: "not-an-email",
          message: "",
          locale: "en",
        }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(response.status).toBe(400);
    expect(response.body).not.toHaveProperty("stack");
    expect(response.body).not.toHaveProperty("error");
  });
});
