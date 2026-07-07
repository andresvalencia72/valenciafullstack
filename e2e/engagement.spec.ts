import { expect, test } from "@playwright/test";

/**
 * engagement: View Counting with Permanent Dedupe, Reactions with
 * Permanent Dedupe. quality-pipeline: End-to-End Test Gate — "engagement"
 * is part of the full flow list the spec requires by the final
 * implementation slice (PR11); PR7 shipped the feature with full unit
 * coverage but no dedicated e2e scenario at the time (see PR7 apply
 * findings — the view POST was only exercised as an incidental side
 * effect of `e2e/blog.spec.ts` rendering the article page). This file
 * closes that gap with a real Playwright round trip against Postgres.
 *
 * Reaction dedupe is server-side permanent, keyed by `visitor_hash`
 * (IP + user agent) — across repeated CI/local runs against the same
 * database, a given (slug, kind) pair may already be "reacted" from a
 * prior run. That's fine: this test only asserts the client-visible
 * contract (unreacted -> click -> visibly active, with a numeric count
 * badge appearing), never an exact before/after count, since Playwright
 * gives every test a fresh browser context (empty localStorage) and the
 * widget's optimistic UI does not depend on the server's dedupe outcome.
 */
test.describe("article engagement (PR7)", () => {
  test("shows a real view count fetched from the server after page load", async ({
    page,
  }) => {
    await page.goto("/es/blog/clean-architecture-nextjs");

    const summary = page.getByRole("region", {
      name: "Interacción del artículo",
    });
    await expect(summary).toBeVisible();
    await expect(summary.getByText(/\d+ visitas/)).toBeVisible();
  });

  test("reacting to an article marks the button active and reveals a numeric count", async ({
    page,
  }) => {
    await page.goto("/es/blog/design-patterns-daily");

    const thumbsUp = page.getByRole("button", { name: "Me gusta" });
    await expect(thumbsUp).toBeVisible();
    await expect(thumbsUp).toHaveAttribute("aria-pressed", "false");

    await thumbsUp.click();

    await expect(thumbsUp).toHaveAttribute("aria-pressed", "true");
    await expect(thumbsUp.getByTestId("reaction-count-thumbs_up")).toBeVisible();
  });

  test("a reacted state persists across a reload via localStorage (optimistic UI, permanent server dedupe)", async ({
    page,
  }) => {
    await page.goto("/es/blog/notas-breves");

    const heart = page.getByRole("button", { name: "Corazón" });
    await heart.click();
    await expect(heart).toHaveAttribute("aria-pressed", "true");

    await page.reload();

    await expect(
      page.getByRole("button", { name: "Corazón" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
