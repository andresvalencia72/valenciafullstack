import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import es from "@/shared/i18n/messages/es.json";
import { SectionNav } from "./section-nav";

function renderWithIntl() {
  return render(
    <NextIntlClientProvider locale="es" messages={es}>
      <SectionNav />
    </NextIntlClientProvider>,
  );
}

describe("SectionNav", () => {
  it("renders an anchor link per implemented section, translated", () => {
    renderWithIntl();

    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute(
      "href",
      "#home",
    );
    expect(screen.getByRole("link", { name: "Sobre mí" })).toHaveAttribute(
      "href",
      "#about",
    );
    expect(screen.getByRole("link", { name: "Habilidades" })).toHaveAttribute(
      "href",
      "#skills",
    );
    expect(screen.getByRole("link", { name: "Proyectos" })).toHaveAttribute(
      "href",
      "#projects",
    );
    expect(screen.getByRole("link", { name: "Artículos" })).toHaveAttribute(
      "href",
      "#articles",
    );
    expect(
      screen.getByRole("link", { name: "GitHub" }),
    ).toHaveAttribute("href", "#github-activity");
    expect(screen.getByRole("link", { name: "Contacto" })).toHaveAttribute(
      "href",
      "#contact",
    );
  });

  it("renders links in section order, implemented sections only (home-page: Section Composition — full nine-section set from PR10)", () => {
    renderWithIntl();

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "#home",
      "#about",
      "#skills",
      "#projects",
      "#articles",
      "#github-activity",
      "#contact",
    ]);
  });

  it("gives each link a coral hover color and an animated coral underline (design fidelity: header)", () => {
    renderWithIntl();

    const link = screen.getByRole("link", { name: "Inicio" });
    expect(link).toHaveClass("hover:text-coral");

    const underline = link.querySelector("[aria-hidden='true']");
    expect(underline).not.toBeNull();
    expect(underline).toHaveClass(
      "bg-coral",
      "scale-x-0",
      "group-hover:scale-x-100",
    );
  });
});

// Real smooth-scroll + URL hash update behavior (home-page: In-Page
// Navigation) is verified against a real browser in
// e2e/home-sections.spec.ts — jsdom does not implement anchor
// same-document hash navigation, so it cannot be asserted here.
