import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { ArticleCover } from "./article-cover";

describe("ArticleCover", () => {
  it("renders the cover placeholder label", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <ArticleCover />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("cover · 1600×900")).toBeInTheDocument();
  });
});
