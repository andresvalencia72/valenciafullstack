import { expect, test } from "@playwright/test";

/**
 * blog: MDX Article Rendering, Missing-Translation Fallback, No Blog
 * Index Route. i18n: Locale Routing (unprefixed /blog), Locale-Matched
 * MDX Resolution (locale switcher article awareness, task 4.6). seo:
 * Bilingual Sitemap with Hreflang / i18n: SEO Metadata Consistency
 * (canonical + hreflang, task 4.5).
 */
test.describe("blog article pages", () => {
  test("renders the article in the requested locale (es)", async ({
    page,
  }) => {
    const response = await page.goto("/es/blog/clean-architecture-nextjs");

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: /Arquitectura limpia/ }),
    ).toBeVisible();
  });

  test("renders the article in the requested locale (en)", async ({
    page,
  }) => {
    const response = await page.goto("/en/blog/clean-architecture-nextjs");

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: /Clean Architecture/ }),
    ).toBeVisible();
  });

  test("renders a syntax-highlighted code block", async ({ page }) => {
    await page.goto("/en/blog/clean-architecture-nextjs");

    const codeBlock = page.locator("code[data-language]").first();
    await expect(codeBlock).toBeVisible();
  });

  test("falls back to the available locale with a visible notice instead of a 404 (blog: Missing-Translation Fallback)", async ({
    page,
  }) => {
    const response = await page.goto("/en/blog/notas-breves");

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("status")).toContainText(
      "only available in Spanish",
    );
    // Content itself still renders (in Spanish), not a blank/broken page.
    await expect(
      page.getByRole("heading", { level: 1, name: /Notas breves/ }),
    ).toBeVisible();
  });

  test("returns 404 when the slug does not exist in either locale", async ({
    request,
  }) => {
    const es = await request.get("/es/blog/does-not-exist");
    const en = await request.get("/en/blog/does-not-exist");

    expect(es.status()).toBe(404);
    expect(en.status()).toBe(404);
  });

  test("unprefixed /blog/:slug redirects to the es-prefixed equivalent with a 308", async ({
    request,
  }) => {
    const response = await request.get(
      "/blog/clean-architecture-nextjs",
      { maxRedirects: 0 },
    );

    expect(response.status()).toBe(308);
    expect(response.headers()["location"]).toContain(
      "/es/blog/clean-architecture-nextjs",
    );
  });

  test("no blog index route exists at either locale (blog: No Blog Index Route)", async ({
    request,
  }) => {
    const es = await request.get("/es/blog");
    const en = await request.get("/en/blog");

    expect(es.status()).toBe(404);
    expect(en.status()).toBe(404);
  });

  test("switching locale on an article page preserves the slug and shows the fallback notice when needed (i18n: Locale-Matched MDX Resolution)", async ({
    page,
  }) => {
    await page.goto("/es/blog/notas-breves");

    // The locale switcher's own labels are translated per the *current*
    // locale (i18n messages `localeSwitcher.en` = "Inglés" while viewing
    // in `es`), not the target locale's name for itself.
    await page.getByRole("button", { name: "Inglés" }).click();

    await expect(page).toHaveURL(/\/en\/blog\/notas-breves$/);
    await expect(page.getByRole("status")).toContainText(
      "only available in Spanish",
    );
  });

  test("declares hreflang alternates and a self-referencing canonical for a bilingual article (seo: Hreflang alternates present)", async ({
    page,
  }) => {
    await page.goto("/es/blog/clean-architecture-nextjs");

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute(
      "href",
      /\/es\/blog\/clean-architecture-nextjs$/,
    );

    const esAlternate = page.locator('link[rel="alternate"][hreflang="es"]');
    const enAlternate = page.locator('link[rel="alternate"][hreflang="en"]');
    const xDefault = page.locator(
      'link[rel="alternate"][hreflang="x-default"]',
    );

    await expect(esAlternate).toHaveAttribute(
      "href",
      /\/es\/blog\/clean-architecture-nextjs$/,
    );
    await expect(enAlternate).toHaveAttribute(
      "href",
      /\/en\/blog\/clean-architecture-nextjs$/,
    );
    await expect(xDefault).toHaveAttribute(
      "href",
      /\/es\/blog\/clean-architecture-nextjs$/,
    );
  });

  test("canonical points to the content locale and omits the missing locale's alternate for an es-only article (seo: Canonical points to available-content locale)", async ({
    page,
  }) => {
    await page.goto("/en/blog/notas-breves");

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute(
      "href",
      /\/es\/blog\/notas-breves$/,
    );

    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]'),
    ).toHaveCount(0);
    await expect(
      page.locator('link[rel="alternate"][hreflang="x-default"]'),
    ).toHaveAttribute("href", /\/es\/blog\/notas-breves$/);
  });

  test("renders the back-to-portfolio link and a next-article card", async ({
    page,
  }) => {
    await page.goto("/es/blog/clean-architecture-nextjs");

    await expect(
      page.getByRole("link", { name: "Volver al portfolio" }),
    ).toHaveAttribute("href", "/es");
    await expect(page.getByText("Siguiente artículo")).toBeVisible();
  });
});
