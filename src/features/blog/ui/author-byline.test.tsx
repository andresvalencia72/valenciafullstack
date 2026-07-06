import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { AuthorByline } from "./author-byline";

describe("AuthorByline", () => {
  it("renders the author name and role", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <AuthorByline />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("Andrés Valencia")).toBeInTheDocument();
    expect(screen.getByText("Full Stack Developer")).toBeInTheDocument();
  });

  it("renders a monogram avatar with the author's initial", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <AuthorByline />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("A")).toBeInTheDocument();
  });
});
