import { expect, test } from "@playwright/test";

/**
 * home-page: Section Composition (skills bento) — design-reference parity
 * regression guard (PR13: skills design fidelity). Encodes the bounding-box
 * relations the design requires: the main-stack card spans 2 grid columns
 * AND 2 grid rows, the learning-now card spans 2 grid columns but stays a
 * single row. This exists because `grid-column`/`grid-row` only apply to
 * DIRECT grid children — a prior regression put the span classes on an
 * inner div instead of the actual grid item (`Reveal`/`Tilt`), so every
 * card silently rendered 1x1 despite the classes existing in the DOM.
 * Unit tests assert the classes are on the right element; this test
 * asserts the classes actually produce the right rendered layout.
 */
test.describe("skills bento layout (design fidelity, PR13)", () => {
  test("desktop (1280px): main-stack card spans 2x2, learning-now card spans 2x1", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto("/es");

    const skillsSection = page.locator("#skills");
    await skillsSection.scrollIntoViewIfNeeded();

    const mainCard = skillsSection.locator(".bg-ink").first();
    // `.bg-coral` also matches the main-stack card's small decorative
    // circle (an aria-hidden span nested inside `.bg-ink`) — filter by
    // text to reliably target the actual learning-now card, not DOM order.
    const learningCard = skillsSection.locator(".bg-coral", {
      hasText: "Next.js",
    });
    const defaultCard = skillsSection.locator(".bg-card").first();

    const [mainBox, learningBox, defaultBox] = await Promise.all([
      mainCard.boundingBox(),
      learningCard.boundingBox(),
      defaultCard.boundingBox(),
    ]);

    expect(mainBox).not.toBeNull();
    expect(learningBox).not.toBeNull();
    expect(defaultBox).not.toBeNull();

    // Main-stack card spans ~2 columns and ~2 rows: roughly double a
    // single-column/single-row card's dimensions (allowing margin for
    // the grid gap eating into a naive 2x multiple).
    expect(mainBox!.width).toBeGreaterThan(defaultBox!.width * 1.7);
    expect(mainBox!.height).toBeGreaterThan(defaultBox!.height * 1.7);

    // Learning-now card spans ~2 columns too (comparable width to the
    // main-stack card), but stays a single row — its height should match
    // a default card's height, not the main-stack card's doubled height.
    expect(learningBox!.width).toBeGreaterThan(defaultBox!.width * 1.7);
    expect(learningBox!.height).toBeLessThan(mainBox!.height * 0.7);

    // Let the Reveal scroll-in animation finish before capturing evidence
    // (the assertions above are geometry-only, unaffected by opacity, but
    // a mid-transition screenshot looks washed out and is misleading as
    // visual evidence).
    await page.waitForTimeout(800);
    await skillsSection.screenshot({
      path: "test-results/skills-bento-1280.png",
    });
  });

  test("mobile (375px): skills section stacks 2-up with no horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/es");

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    await expect(page.locator("#skills")).toBeVisible();
  });
});
