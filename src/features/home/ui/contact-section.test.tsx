import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { ContactSection } from "./contact-section";

function renderWithIntl() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ContactSection />
    </NextIntlClientProvider>,
  );
}

describe("ContactSection", () => {
  it("renders the section with id=contact for anchor navigation", () => {
    renderWithIntl();

    expect(document.getElementById("contact")).not.toBeNull();
  });

  it("renders the name, email, and message fields (contact: Server-Side Input Validation shape)", () => {
    renderWithIntl();

    expect(screen.getByLabelText("Your name")).toBeInTheDocument();
    expect(screen.getByLabelText("Your email")).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toBeInTheDocument();
  });

  it("renders a disabled submit button — PR3b ships a static shell only, PR6 wires the functional form", () => {
    renderWithIntl();

    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
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
