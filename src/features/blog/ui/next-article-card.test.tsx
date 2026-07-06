import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { NextArticleCard } from "./next-article-card";

describe("NextArticleCard", () => {
  it("renders a link to the next article with its category and title", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <NextArticleCard
          slug="design-patterns"
          locale="en"
          title="Design Patterns I Use Every Day"
          category="patterns"
          readingTimeMinutes={6}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("Next article")).toBeInTheDocument();
    const link = screen.getByRole("link", {
      name: /Design Patterns I Use Every Day/,
    });
    expect(link).toHaveAttribute("href", "/en/blog/design-patterns");
    expect(screen.getByText("Patterns · 6 min")).toBeInTheDocument();
  });
});
