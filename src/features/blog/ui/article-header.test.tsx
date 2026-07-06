import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { ArticleHeader } from "./article-header";

describe("ArticleHeader", () => {
  it("renders the category badge, date + reading time, and highlighted title", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <ArticleHeader
          title="Clean Architecture in Next.js"
          category="architecture"
          date="2026-06-14"
          locale="en"
          readingTimeMinutes={8}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("Architecture")).toBeInTheDocument();
    expect(screen.getByText("Jun 14, 2026 · 8 min read")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Clean Architecture in Next.js",
      }),
    ).toBeInTheDocument();
  });
});
