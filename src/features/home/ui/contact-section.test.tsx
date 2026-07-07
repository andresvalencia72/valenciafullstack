import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { ContactSection } from "./contact-section";

function renderWithIntl() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ContactSection>
        <div data-testid="injected-form">form goes here</div>
      </ContactSection>
    </NextIntlClientProvider>,
  );
}

describe("ContactSection", () => {
  it("renders the section with id=contact for anchor navigation", () => {
    renderWithIntl();

    expect(document.getElementById("contact")).not.toBeNull();
  });

  it("renders the form passed as children — cross-feature composition happens at the app/ level, not via a direct home -> contact import (home-page: Section Composition)", () => {
    renderWithIntl();

    expect(screen.getByTestId("injected-form")).toHaveTextContent(
      "form goes here",
    );
  });

  it("renders social links to reach the site owner without email", () => {
    renderWithIntl();

    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/andresvalencia72",
    );
    expect(screen.getByRole("link", { name: "YouTube" })).toHaveAttribute(
      "href",
      "https://www.youtube.com/@codeink1",
    );
  });
});
