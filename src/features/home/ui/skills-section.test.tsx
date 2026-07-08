import { render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { SkillsSection } from "./skills-section";

function renderWithIntl() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <SkillsSection />
    </NextIntlClientProvider>,
  );
}

describe("SkillsSection", () => {
  it("renders the section with id=skills, heading, and subheading", () => {
    renderWithIntl();

    expect(document.getElementById("skills")).not.toBeNull();
    expect(
      screen.getByRole("heading", { level: 2, name: /skills/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/the tools i build with every day/i),
    ).toBeInTheDocument();
  });

  it("renders the main-stack card with all three stack titles and its description", () => {
    renderWithIntl();

    expect(screen.getByText("Main stack")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Node.js")).toBeInTheDocument();
    expect(
      screen.getByText(/what i use to build most of my products/i),
    ).toBeInTheDocument();
  });

  it("renders every remaining skill card with its category, title, and description", () => {
    renderWithIntl();

    const expectedCards = [
      ["Language", "JavaScript", "The language I think in."],
      ["Backend", "PHP", "Solid backend, still very relevant."],
      ["Data", "SQL", "PostgreSQL & MySQL."],
      ["Workflow", "Git", "Version control and teamwork."],
      ["Learning now", "Next.js · App Router", null],
      ["Infra", "Docker", "Reproducible environments."],
      ["Design", "Figma", "From design to code."],
    ] as const;

    for (const [category, title, description] of expectedCards) {
      expect(screen.getByText(category)).toBeInTheDocument();
      expect(screen.getByText(title)).toBeInTheDocument();
      if (description) {
        expect(screen.getByText(description)).toBeInTheDocument();
      }
    }
  });

  it("renders the design-reference-matched devicon brand icon for every card (design-system: Token Derivation)", async () => {
    const { container } = renderWithIntl();

    const expectedIconsByOrder = [
      "javascript",
      "php",
      "postgresql",
      "git",
      "nextjs",
      "docker",
      "figma",
    ];

    // Icons load via LazyIcon (dynamically imported, client-mounted —
    // see icons/lazy-icon.tsx) rather than synchronously on first
    // render, so assert once all 10 have appeared.
    await waitFor(() => {
      expect(container.querySelectorAll("svg[data-icon]")).toHaveLength(10);
    });

    const dataIcons = Array.from(
      container.querySelectorAll("svg[data-icon]"),
    ).map((svg) => svg.getAttribute("data-icon"));

    // Main-stack card renders first (React, TypeScript, Node.js), then
    // the seven single/wide skill cards in skills-data.ts's declared order.
    expect(dataIcons).toEqual([
      "react",
      "typescript",
      "nodejs",
      ...expectedIconsByOrder,
    ]);
  });
});
