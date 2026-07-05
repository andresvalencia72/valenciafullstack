import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { AboutSection } from "./about-section";

function renderWithIntl() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <AboutSection />
    </NextIntlClientProvider>,
  );
}

describe("AboutSection", () => {
  it("renders the section with id=about for anchor navigation", () => {
    renderWithIntl();

    expect(
      screen.getByRole("heading", { level: 2, name: /hi, i'm andrés/i }),
    ).toBeInTheDocument();
    expect(document.getElementById("about")).not.toBeNull();
  });

  it("renders both paragraphs with the bolded tech list", () => {
    renderWithIntl();

    expect(
      screen.getByText(/I build web applications end to end/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText("JavaScript, TypeScript, React, Node.js, PHP, and SQL"),
    ).toBeInTheDocument();
    expect(screen.getByText("Next.js")).toBeInTheDocument();
  });

  it("renders both CTAs and the photo placeholder", () => {
    renderWithIntl();

    expect(screen.getByRole("link", { name: "Contact me" })).toHaveAttribute(
      "href",
      "#contact",
    );
    expect(screen.getByText("Download CV")).toBeInTheDocument();
    expect(screen.getByText("photo · working")).toBeInTheDocument();
  });
});
