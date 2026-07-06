import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import es from "@/shared/i18n/messages/es.json";
import { CategoryBadge } from "./category-badge";

describe("CategoryBadge", () => {
  it("renders the localized label for a known category id (es)", () => {
    render(
      <NextIntlClientProvider locale="es" messages={es}>
        <CategoryBadge category="architecture" />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("Arquitectura")).toBeInTheDocument();
  });

  it("renders the localized label for a known category id (en)", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <CategoryBadge category="patterns" />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("Patterns")).toBeInTheDocument();
  });
});
