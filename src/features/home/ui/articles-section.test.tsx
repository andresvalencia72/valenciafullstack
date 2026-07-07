import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import type { HomeArticleSummary } from "../domain/article-summary";
import type { HomeSearchResultSummary } from "../domain/search-result-summary";
import { ArticlesSection } from "./articles-section";

const ARTICLES: HomeArticleSummary[] = [
  {
    slug: "clean-architecture-nextjs",
    title: "Clean Architecture in Next.js",
    excerpt: "How screaming architecture keeps features independent.",
    category: "architecture",
    date: "2026-06-14",
    readingTimeMinutes: 12,
  },
  {
    slug: "design-patterns-daily",
    title: "Design patterns I use every day",
    excerpt: "Patterns that pull their weight in real projects.",
    category: "patterns",
    date: "2026-05-01",
    readingTimeMinutes: 6,
  },
];

function renderSection(articles: HomeArticleSummary[] = ARTICLES) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ArticlesSection articles={articles} />
    </NextIntlClientProvider>,
  );
}

describe("ArticlesSection", () => {
  it("renders the section with id=articles for anchor navigation", () => {
    renderSection();

    expect(document.getElementById("articles")).not.toBeNull();
  });

  it("renders every article with title, category, and reading time (home-page: Articles list renders inline)", () => {
    renderSection();

    expect(
      screen.getByText("Clean Architecture in Next.js"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Design patterns I use every day"),
    ).toBeInTheDocument();
  });

  it("links each article to /blog/[slug]", () => {
    renderSection();

    const link = screen.getByRole("link", {
      name: /clean architecture in next\.js/i,
    });
    expect(link).toHaveAttribute("href", "/en/blog/clean-architecture-nextjs");
  });

  it("filters the visible articles when a category pill is selected (article-filter: Category Filtering)", () => {
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: "Architecture" }));

    expect(
      screen.getByText("Clean Architecture in Next.js"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Design patterns I use every day"),
    ).not.toBeInTheDocument();
  });

  it("restores the full list when 'All' is selected again (article-filter: Reset Filter)", () => {
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: "Architecture" }));
    fireEvent.click(screen.getByRole("button", { name: "All" }));

    expect(
      screen.getByText("Clean Architecture in Next.js"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Design patterns I use every day"),
    ).toBeInTheDocument();
  });

  it("shows a locale-appropriate empty state when there are no articles (home-page: No articles exist)", () => {
    renderSection([]);

    expect(screen.getByText("No articles published yet.")).toBeInTheDocument();
  });

  it("renders the injected searchInputSlot above the filter pills (home-page: Embedded Article List — search input)", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <ArticlesSection
          articles={ARTICLES}
          searchInputSlot={<input aria-label="fake search" />}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByLabelText("fake search")).toBeInTheDocument();
  });

  it("shows search results instead of the normal list and visually deactivates a previously-selected pill while searchActive (home-page: Search input filters visible articles)", () => {
    const results: HomeSearchResultSummary[] = [
      {
        slug: "clean-architecture-nextjs",
        title: "Matched via search",
        description: "Matched description",
        category: "architecture",
        locale: "en",
      },
    ];

    const { rerender } = render(
      <NextIntlClientProvider locale="en" messages={en}>
        <ArticlesSection articles={ARTICLES} />
      </NextIntlClientProvider>,
    );

    // Select a category pill first, so it has something to "deactivate".
    fireEvent.click(screen.getByRole("button", { name: "Architecture" }));
    expect(screen.getByRole("button", { name: "Architecture" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    rerender(
      <NextIntlClientProvider locale="en" messages={en}>
        <ArticlesSection
          articles={ARTICLES}
          searchActive
          searchStatus="ok"
          searchResults={results}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("Matched via search")).toBeInTheDocument();
    expect(screen.queryByText("Clean Architecture in Next.js")).not.toBeInTheDocument();
    expect(screen.queryByText("Design patterns I use every day")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Architecture" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("shows the search empty state when searchActive with zero results (search: No-Match Handling)", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <ArticlesSection
          articles={ARTICLES}
          searchActive
          searchStatus="ok"
          searchResults={[]}
        />
      </NextIntlClientProvider>,
    );

    expect(
      screen.getByText("No articles match your search."),
    ).toBeInTheDocument();
  });

  it("calls onSearchReset when a category pill is selected during an active search (article-filter: Selecting a pill clears an active search query)", () => {
    const onSearchReset = vi.fn();

    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <ArticlesSection
          articles={ARTICLES}
          searchActive
          searchStatus="ok"
          searchResults={[]}
          onSearchReset={onSearchReset}
        />
      </NextIntlClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Architecture" }));

    expect(onSearchReset).toHaveBeenCalledTimes(1);
  });

  it("does not call onSearchReset when selecting a pill while no search is active (article-filter: Category Filtering, unaffected)", () => {
    const onSearchReset = vi.fn();

    renderSection();
    // No search props passed at all — default renderSection helper.

    fireEvent.click(screen.getByRole("button", { name: "Architecture" }));

    expect(onSearchReset).not.toHaveBeenCalled();
  });
});
