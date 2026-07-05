import { expect, test } from "@playwright/test";

/**
 * i18n: Locale Routing. Verifies the concrete, framework-emitted
 * status codes — next-intl's middleware defaults to a 307 redirect
 * (confirmed against its `NextResponse.redirect(url)` call site and
 * Next's default status during PR2); the spec requires 308
 * (permanent), so the Proxy (`proxy.ts`) upgrades it. This test locks
 * in that decision against regressions.
 */
test.describe("i18n locale routing", () => {
  test("root redirects to the default locale with a 308", async ({
    request,
  }) => {
    const response = await request.get("/", { maxRedirects: 0 });

    expect(response.status()).toBe(308);
    expect(response.headers()["location"]).toContain("/es");
  });

  test("an unprefixed path redirects to its es-prefixed equivalent with a 308", async ({
    request,
  }) => {
    const response = await request.get("/about", { maxRedirects: 0 });

    expect(response.status()).toBe(308);
    expect(response.headers()["location"]).toContain("/es/about");
  });

  test("an explicit locale is served directly", async ({ request }) => {
    const response = await request.get("/en", { maxRedirects: 0 });

    expect(response.status()).toBe(200);
  });

  test("/api paths are excluded from locale redirecting", async ({
    request,
  }) => {
    const response = await request.get("/api/does-not-exist", {
      maxRedirects: 0,
    });

    expect(response.status()).not.toBe(308);
    expect(response.status()).not.toBe(307);
  });
});
