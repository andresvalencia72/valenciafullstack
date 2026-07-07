import { expect, test } from "@playwright/test";

/**
 * home-page: Section Composition, In-Page Navigation, Responsive Layout
 * — the full nine-section set (PR3a: hero, stack strip, about, skills
 * bento; PR3b: projects, articles list + category filter, contact,
 * footer; PR10: github activity, streamed between articles and contact)
 * per the home-page spec's "Full page render" scenario. In CI, no
 * `GITHUB_TOKEN` is configured for the e2e job, so the github activity
 * section always resolves to its fallback panel (github-activity:
 * Graceful Failure Handling) — still rendered with `id="github-activity"`,
 * so the section-order assertion below holds either way.
 */
test.describe("home sections (PR3a + PR3b + PR10)", () => {
  test("renders the implemented sections in spec order", async ({ page }) => {
    await page.goto("/es");

    const sectionIds = await page
      .locator("main section[id]")
      .evaluateAll((sections) => sections.map((section) => section.id));

    expect(sectionIds).toEqual([
      "home",
      "about",
      "skills",
      "projects",
      "articles",
      "github-activity",
      "contact",
    ]);
  });

  test("anchor nav scrolls to the target section and updates the URL hash", async ({
    page,
  }) => {
    await page.goto("/es");

    await page.getByRole("link", { name: "Habilidades" }).click();
    await expect(page).toHaveURL(/#skills$/);

    const skillsSection = page.locator("#skills");
    await expect(skillsSection).toBeInViewport();
  });

  test("mobile viewport (375px): sections stack with no horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/es");

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    const ctaBox = await page
      .getByRole("link", { name: "Trabajemos juntos" })
      .boundingBox();
    expect(ctaBox?.height).toBeGreaterThanOrEqual(44);
  });

  test("mobile viewport (375px): projects, articles, and filter pills stack with no horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/es");

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    await expect(page.locator("#projects")).toBeVisible();
    await expect(page.locator("#articles")).toBeVisible();

    const allPillBox = await page
      .getByRole("button", { name: "Todos" })
      .boundingBox();
    expect(allPillBox?.height).toBeGreaterThanOrEqual(24);
  });

  test("tablet viewport (768px): projects and articles sections render with no horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/es");

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    await expect(page.locator("#projects")).toBeVisible();
    await expect(page.locator("#articles")).toBeVisible();
  });

  test("desktop viewport (1440px): projects and articles sections render with no horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/es");

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    await expect(page.locator("#projects")).toBeVisible();
    await expect(page.locator("#articles")).toBeVisible();
  });

  test("selecting a category filter pill filters the visible articles (article-filter: Category Filtering)", async ({
    page,
  }) => {
    await page.goto("/es");

    const articlesSection = page.locator("#articles");
    const initialCount = await articlesSection.getByRole("link").count();
    expect(initialCount).toBeGreaterThan(0);

    await page.getByRole("button", { name: "Arquitectura" }).click();

    const filteredLinks = articlesSection.getByRole("link");
    await expect(filteredLinks.first()).toBeVisible();
    const filteredCount = await filteredLinks.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    await page.getByRole("button", { name: "Todos" }).click();
    await expect(articlesSection.getByRole("link")).toHaveCount(initialCount);
  });
});
