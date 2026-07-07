import { expect, test } from "@playwright/test";

/**
 * search: Full-Text Query, Relevance Ranking, No-Match Handling; home-page:
 * Embedded Article List — search input; article-filter: Selecting a pill
 * clears an active search query / Selecting a category pill during an
 * active search. Requires `article_search` to be populated — the e2e seed
 * step runs `npm run db:sync-search` after migrations (task 8.1).
 */
test.describe("article search (PR8)", () => {
  test("typing a query shows matching results in place and deactivates a previously-selected category pill", async ({
    page,
  }) => {
    await page.goto("/es");

    const articlesSection = page.locator("#articles");
    const searchInput = articlesSection.getByRole("searchbox");
    await expect(searchInput).toBeVisible();

    // Select a category pill first, so there's something to "deactivate".
    await page.getByRole("button", { name: "Arquitectura" }).click();
    await expect(page.getByRole("button", { name: "Arquitectura" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await searchInput.fill("arquitectura");

    await expect(articlesSection.getByText("Arquitectura limpia en Next.js")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("button", { name: "Arquitectura" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("clearing the query restores the 'Todos' pill and the full articles list", async ({
    page,
  }) => {
    await page.goto("/es");

    const articlesSection = page.locator("#articles");
    const searchInput = articlesSection.getByRole("searchbox");
    const initialCount = await articlesSection.getByRole("link").count();

    await searchInput.fill("arquitectura");
    await expect(articlesSection.getByText("Arquitectura limpia en Next.js")).toBeVisible();

    await searchInput.fill("");

    await expect(page.getByRole("button", { name: "Todos" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(articlesSection.getByRole("link")).toHaveCount(initialCount);
  });

  test("selecting a category pill during an active search clears the query and filters the full list", async ({
    page,
  }) => {
    await page.goto("/es");

    const articlesSection = page.locator("#articles");
    const searchInput = articlesSection.getByRole("searchbox");

    await searchInput.fill("arquitectura");
    await expect(articlesSection.getByText("Arquitectura limpia en Next.js")).toBeVisible();

    await page.getByRole("button", { name: "Arquitectura" }).click();

    await expect(searchInput).toHaveValue("");
    await expect(page.getByRole("button", { name: "Arquitectura" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("a query with no matches shows the search empty state (search: No-Match Handling)", async ({
    page,
  }) => {
    await page.goto("/es");

    const articlesSection = page.locator("#articles");
    await articlesSection.getByRole("searchbox").fill("xyzzyplughnomatch");

    await expect(articlesSection.getByText("Ningún artículo coincide con tu búsqueda.")).toBeVisible(
      { timeout: 5000 },
    );
  });
});
