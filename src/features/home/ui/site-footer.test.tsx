import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { SiteFooter } from "./site-footer";

function renderWithIntl() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <SiteFooter />
    </NextIntlClientProvider>,
  );
}

describe("SiteFooter", () => {
  it("renders anchor links to the home page sections", () => {
    renderWithIntl();

    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "#about",
    );
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute(
      "href",
      "#projects",
    );
    expect(screen.getByRole("link", { name: "Articles" })).toHaveAttribute(
      "href",
      "#articles",
    );
  });

  it("renders a link to the privacy disclosure page (contact: Privacy Disclosure)", () => {
    renderWithIntl();

    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute(
      "href",
      "/en/privacy",
    );
  });

  it("renders a back-to-top link", () => {
    renderWithIntl();

    expect(
      screen.getByRole("link", { name: "Back to top" }),
    ).toHaveAttribute("href", "#home");
  });

  it("renders the copyright line with the current year and the owner's name", () => {
    renderWithIntl();

    const year = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`${year}`)),
    ).toBeInTheDocument();
    expect(screen.getByText("Andrés Valencia")).toBeInTheDocument();
  });
});
