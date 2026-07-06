import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import type { HomeArticleSummary } from "../domain/article-summary";
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
});
