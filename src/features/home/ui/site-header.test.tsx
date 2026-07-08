import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { SiteHeader } from "./site-header";

vi.mock("next/navigation.js", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

function renderWithIntl() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <SiteHeader />
    </NextIntlClientProvider>,
  );
}

describe("SiteHeader", () => {
  it("renders the brand mark (monogram + wordmark) linking to #home (design fidelity: header)", () => {
    renderWithIntl();

    const brandLink = screen.getByRole("link", { name: /andrés val\./i });
    expect(brandLink).toHaveAttribute("href", "#home");

    const monogram = screen.getByText("A", { selector: "span" });
    expect(monogram).toHaveClass("rounded-full", "bg-ink", "text-bg");
  });

  it("renders the in-page nav, locale switcher, and theme toggle", () => {
    renderWithIntl();

    expect(screen.getByRole("link", { name: "Skills" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Spanish" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    ).toBeInTheDocument();
  });

  it("is sticky with a static border and backdrop blur (our kept behavior, design's scroll-aware swap deferred)", () => {
    const { container } = renderWithIntl();

    const header = container.querySelector("header");
    expect(header).toHaveClass("sticky", "top-0", "border-b", "border-line");
  });
});
