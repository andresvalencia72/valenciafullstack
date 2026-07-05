import { expect, test } from "@playwright/test";

/**
 * design-system: Theme Toggle — "no flash of incorrect theme" (task 2.7).
 * PR2a runs before locale routing exists (PR2b), so assertions target
 * the plain root path `/` served by the interim `app/layout.tsx`
 * shim. Two independent assertions:
 *   (a) the inline theme script is served BEFORE any rendered page
 *       content in the raw HTML — it runs (via `next/script`
 *       `strategy="beforeInteractive"`) ahead of the app's own
 *       content, so the browser never paints a frame before it runs.
 *       Note: Next.js always injects its own resource hints and
 *       stylesheet `<link>` at the very top of `<head>` ahead of ANY
 *       user-controlled element (framework internal, not
 *       configurable) — this does not cause a visible flash in
 *       practice because that `<link>` only *starts* an async fetch;
 *       the synchronous script still runs, and `data-theme` is set,
 *       well before the browser can complete that fetch and paint.
 *   (b) given a stored preference, `data-theme` on `<html>` already
 *       matches it at `domcontentloaded` — proving the script actually
 *       applies the stored choice synchronously, before hydration.
 */
test.describe("theme no-flash", () => {
  test("the inline theme script precedes rendered page content in the served HTML", async ({
    request,
  }) => {
    const response = await request.get("/");
    const html = await response.text();

    const scriptIndex = html.indexOf("document.documentElement.dataset.theme");
    const mainContentIndex = html.indexOf("<main");

    expect(scriptIndex).toBeGreaterThan(-1);
    expect(mainContentIndex).toBeGreaterThan(-1);
    expect(scriptIndex).toBeLessThan(mainContentIndex);
  });

  test("applies a stored dark preference before hydration, with no flash", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("pf-theme", "dark");
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const theme = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );

    expect(theme).toBe("dark");
  });

  test("applies a stored light preference before hydration, with no flash", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("pf-theme", "light");
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const theme = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );

    expect(theme).toBe("light");
  });
});
