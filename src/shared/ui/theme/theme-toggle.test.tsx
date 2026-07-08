import { NextIntlClientProvider } from "next-intl";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { THEME_STORAGE_KEY } from "./theme-init-script";
import { ThemeToggle } from "./theme-toggle";

function renderWithIntl() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ThemeToggle />
    </NextIntlClientProvider>,
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = "light";
    window.localStorage.clear();
  });

  afterEach(() => {
    delete document.documentElement.dataset.theme;
    window.localStorage.clear();
  });

  it("reflects the current theme set on the document element", () => {
    document.documentElement.dataset.theme = "dark";

    renderWithIntl();

    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toBeInTheDocument();
  });

  it("switches the document theme and persists the choice on click", () => {
    renderWithIntl();

    fireEvent.click(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    );

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toBeInTheDocument();
  });

  it("toggles back to light on a second click", () => {
    renderWithIntl();

    const button = screen.getByRole("button", { name: "Switch to dark theme" });
    fireEvent.click(button);
    fireEvent.click(screen.getByRole("button", { name: "Switch to light theme" }));

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("is a 38px circular button with a 1px border (design fidelity: header)", () => {
    renderWithIntl();

    const button = screen.getByRole("button", {
      name: "Switch to dark theme",
    });
    expect(button).toHaveClass(
      "h-9.5",
      "w-9.5",
      "rounded-full",
      "border",
      "border-line",
    );
  });

  it("renders a pure-CSS moon icon in light mode", () => {
    renderWithIntl();

    expect(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    ).toContainElement(document.querySelector('[data-icon="moon"]'));
    expect(document.querySelector('[data-icon="sun"]')).toBeNull();
  });

  it("renders a pure-CSS sun icon in dark mode", () => {
    document.documentElement.dataset.theme = "dark";

    renderWithIntl();

    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toContainElement(document.querySelector('[data-icon="sun"]'));
    expect(document.querySelector('[data-icon="moon"]')).toBeNull();
  });
});
