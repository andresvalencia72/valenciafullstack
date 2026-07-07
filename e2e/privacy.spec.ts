import { expect, test } from "@playwright/test";

/**
 * contact: Privacy Disclosure — footer link + page content, both
 * locales.
 */
test.describe("Privacy disclosure page (PR6)", () => {
  test("is reachable from the footer and states a deletion-request email address", async ({
    page,
  }) => {
    await page.goto("/en");

    await page.getByRole("link", { name: "Privacy" }).click();
    await expect(page).toHaveURL(/\/en\/privacy$/);
    await expect(page.getByRole("heading", { name: "Privacy", level: 1 })).toBeVisible();
    await expect(page.getByText(/privacy@valenciafullstack\.dev/)).toBeVisible();
  });

  test("renders in Spanish at /es/privacy", async ({ page }) => {
    await page.goto("/es/privacy");

    await expect(
      page.getByRole("heading", { name: "Privacidad", level: 1 }),
    ).toBeVisible();
  });
});
