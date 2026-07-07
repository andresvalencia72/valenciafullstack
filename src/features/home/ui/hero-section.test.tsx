import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { HeroSection } from "./hero-section";

function renderWithIntl() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <HeroSection />
    </NextIntlClientProvider>,
  );
}

describe("HeroSection", () => {
  it("renders the section with id=home for anchor navigation", () => {
    renderWithIntl();

    expect(
      screen.getByRole("region", { name: /andrés valencia/i }),
    ).toHaveAttribute("id", "home");
  });

  it("renders the availability eyebrow, name, and highlighted role", () => {
    renderWithIntl();

    expect(screen.getByText("Available for projects")).toBeInTheDocument();
    expect(screen.getByText("Andrés")).toBeInTheDocument();
    expect(screen.getByText("Valencia")).toBeInTheDocument();
    expect(screen.getByText("Full Stack Developer")).toBeInTheDocument();
    expect(
      screen.getByText(/with visual judgment and an obsession for detail/i),
    ).toBeInTheDocument();
  });

  it("renders the primary CTA and social links", () => {
    renderWithIntl();

    expect(
      screen.getByRole("link", { name: "Let's work together" }),
    ).toHaveAttribute("href", "#contact");
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/andresvalencia72",
    );
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      expect.stringContaining("linkedin.com"),
    );
    expect(screen.getByRole("link", { name: "YouTube" })).toHaveAttribute(
      "href",
      "https://www.youtube.com/@codeink1",
    );
  });

  it("renders the photo placeholder", () => {
    renderWithIntl();

    expect(screen.getByText("photo · portrait")).toBeInTheDocument();
  });

  it("does not gate above-the-fold hero content behind a scroll-triggered reveal animation (quality-pipeline: Lighthouse Performance Budget — LCP)", () => {
    // The hero is the first thing visible on page load — nothing needs
    // to be scrolled into view for it to matter. `Reveal` (framer-motion
    // `whileInView`) renders its initial, pre-animation state as literal
    // inline `opacity: 0`ux (verified: `<div data-motion="active"
    // style="opacity: 0; ...">`) until client JS hydrates and an
    // IntersectionObserver fires — real Lighthouse measurement showed
    // this adds ~3.4s of pure "Render Delay" to the hero paragraph's LCP
    // (88% of the metric), enough on its own to drop the home page below
    // the Performance >= 90 budget. No element in the hero section may
    // start invisible this way. `Tilt`/`Magnetic` (interaction-only —
    // pointer-driven transform, no opacity gating) remain unaffected.
    const { container } = renderWithIntl();

    const hiddenOnMount = Array.from(
      container.querySelectorAll<HTMLElement>("[style]"),
    ).filter((element) => element.style.opacity === "0");

    expect(hiddenOnMount).toEqual([]);
  });
});
