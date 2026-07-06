import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { ProjectsSection } from "./projects-section";

function renderWithIntl() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ProjectsSection />
    </NextIntlClientProvider>,
  );
}

describe("ProjectsSection", () => {
  it("renders the section with id=projects for anchor navigation", () => {
    renderWithIntl();

    expect(
      screen.getByRole("heading", { level: 2, name: /projects/i }),
    ).toBeInTheDocument();
    expect(document.getElementById("projects")).not.toBeNull();
  });

  it("renders all three project entries with index, title, and tech pills", () => {
    renderWithIntl();

    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
    expect(
      screen.getByText("Valencia Fullstack — this portfolio"),
    ).toBeInTheDocument();
    expect(screen.getByText("Project 2 (placeholder)")).toBeInTheDocument();
    expect(screen.getByText("Project 3 (placeholder)")).toBeInTheDocument();
    expect(screen.getAllByText("Next.js").length).toBeGreaterThanOrEqual(1);
  });

  it("renders demo and repo links for the real project", () => {
    renderWithIntl();

    const portfolioHeading = screen.getByText(
      "Valencia Fullstack — this portfolio",
    );
    const article = portfolioHeading.closest("article");
    expect(article).not.toBeNull();

    const repoLink = within(article as HTMLElement).getByRole("link", {
      name: /repository/i,
    });
    expect(repoLink).toHaveAttribute(
      "href",
      "https://github.com/andresvalencia72/valenciafullstack",
    );
  });

  it("marks placeholder entries with a visible placeholder badge", () => {
    renderWithIntl();

    expect(
      screen.getAllByText("Placeholder — replace with a real project"),
    ).toHaveLength(2);
  });
});
