import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { StackStrip } from "./stack-strip";

describe("StackStrip", () => {
  it("renders every stack strip item from the message catalog", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <StackStrip />
      </NextIntlClientProvider>,
    );

    for (const item of en.home.stackStrip.items) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
  });
});
