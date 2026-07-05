import { expect, test } from "@playwright/test";

/**
 * Scaffolding-slice smoke test (PR1). The full e2e flow list (locale
 * switch, theme, filter, search, contact, article view, engagement,
 * github activity) grows with each subsequent slice per the
 * quality-pipeline spec's End-to-End Test Gate — this file only covers
 * what exists at this point: the app boots and serves the required
 * security headers.
 */
test.describe("scaffolding smoke test", () => {
  test("home page responds with 200", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
  });

  test("security headers are present on every response", async ({
    request,
  }) => {
    const response = await request.get("/");
    const headers = response.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["strict-transport-security"]).toContain("max-age=");

    const csp = headers["content-security-policy"];
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
  });
});
