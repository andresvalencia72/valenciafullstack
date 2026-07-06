import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { FallbackNotice } from "./fallback-notice";

describe("FallbackNotice", () => {
  it("renders a visible notice naming the content locale's language (blog: Missing-Translation Fallback)", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <FallbackNotice contentLocale="es" />
      </NextIntlClientProvider>,
    );

    expect(
      screen.getByText("This article is only available in Spanish."),
    ).toBeInTheDocument();
  });

  it("exposes the notice with role=status for assistive tech", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <FallbackNotice contentLocale="es" />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
