import { expect, test } from "@playwright/test";

/**
 * home-page: Section Composition (partial), In-Page Navigation,
 * Responsive Layout (partial) — scoped to the sections implemented to
 * date (PR3a: hero, stack strip, about, skills bento). This section-
 * order assertion grows with each later slice (PR3b adds projects/
 * articles/contact/footer, PR10 adds github activity) per the
 * home-page spec's "Full page render" scenario.
 */
test.describe("home sections (PR3a)", () => {
  test("renders the implemented sections in spec order", async ({ page }) => {
    await page.goto("/es");

    const sectionIds = await page
      .locator("main section[id]")
      .evaluateAll((sections) => sections.map((section) => section.id));

    expect(sectionIds).toEqual(["home", "about", "skills"]);
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
});
