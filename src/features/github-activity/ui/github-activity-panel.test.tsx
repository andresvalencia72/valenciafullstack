import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import type { GithubActivityResult } from "../application/get-github-activity";
import { GithubActivityPanel } from "./github-activity-panel";

function renderWithIntl(result: GithubActivityResult) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <GithubActivityPanel result={result} />
    </NextIntlClientProvider>,
  );
}

describe("GithubActivityPanel", () => {
  it("renders the section with id=github-activity for anchor navigation and section-order (home-page: Section Composition)", () => {
    renderWithIntl({ kind: "unavailable" });

    expect(document.getElementById("github-activity")).not.toBeNull();
  });

  it("renders repository cards and stats when data is available (github-activity: Server-Side GitHub Data Fetch)", () => {
    renderWithIntl({
      kind: "available",
      data: {
        username: "andresvalencia72",
        publicRepoCount: 12,
        followerCount: 5,
        recentContributionCount: 7,
        topRepositories: [
          {
            name: "valenciafullstack",
            url: "https://github.com/andresvalencia72/valenciafullstack",
            description: "Portfolio site",
            stars: 3,
            language: "TypeScript",
          },
        ],
      },
    });

    expect(
      screen.getByRole("link", { name: /valenciafullstack/ }),
    ).toHaveAttribute("href", "https://github.com/andresvalencia72/valenciafullstack");
    expect(screen.getByText("Portfolio site")).toBeInTheDocument();
  });

  it("renders the fallback panel without repository cards when unavailable (github-activity: Graceful Failure Handling)", () => {
    renderWithIntl({ kind: "unavailable" });

    const fallback = screen.getByText(
      "GitHub activity is temporarily unavailable.",
    );
    expect(fallback).toHaveAttribute("aria-live", "polite");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
