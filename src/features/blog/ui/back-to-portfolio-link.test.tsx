import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { BackToPortfolioLink } from "./back-to-portfolio-link";

describe("BackToPortfolioLink", () => {
  it("links back to the locale home page with the translated label", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <BackToPortfolioLink />
      </NextIntlClientProvider>,
    );

    const link = screen.getByRole("link", { name: "Back to portfolio" });
    expect(link).toHaveAttribute("href", "/en");
  });
});
