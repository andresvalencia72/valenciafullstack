import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { GithubActivityLoading } from "./github-activity-loading";

function renderWithIntl() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <GithubActivityLoading />
    </NextIntlClientProvider>,
  );
}

describe("GithubActivityLoading", () => {
  it("renders the section with id=github-activity so anchor nav and section-order stay stable while streaming (github-activity: Non-Blocking Render)", () => {
    renderWithIntl();

    expect(document.getElementById("github-activity")).not.toBeNull();
  });

  it("renders a loading status message (github-activity: Non-Blocking Render — loading state until data resolves)", () => {
    renderWithIntl();

    const loadingMessage = screen.getByText("Loading GitHub activity…");
    expect(loadingMessage).toHaveAttribute("aria-live", "polite");
  });
});
