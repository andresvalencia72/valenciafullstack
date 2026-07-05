import { NextIntlClientProvider } from "next-intl";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { LocaleSwitcher } from "./locale-switcher";

const replace = vi.fn();

vi.mock("next/navigation.js", () => ({
  useRouter: () => ({ replace, push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/about",
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

function renderSwitcher(locale: "es" | "en") {
  return render(
    <NextIntlClientProvider locale={locale} messages={en}>
      <LocaleSwitcher />
    </NextIntlClientProvider>,
  );
}

describe("LocaleSwitcher", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it("renders a control for every supported locale", () => {
    renderSwitcher("es");

    expect(screen.getByRole("button", { name: "Spanish" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
  });

  it("marks the active locale as pressed", () => {
    renderSwitcher("es");

    expect(screen.getByRole("button", { name: "Spanish" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("switches locale while preserving the current page", () => {
    renderSwitcher("es");

    fireEvent.click(screen.getByRole("button", { name: "English" }));

    // next-intl's locale-aware router resolves the final localized
    // href itself before delegating to the underlying `next/navigation`
    // router — the current page ("/about") is preserved, re-prefixed
    // with the target locale.
    expect(replace).toHaveBeenCalledWith("/en/about");
  });
});
