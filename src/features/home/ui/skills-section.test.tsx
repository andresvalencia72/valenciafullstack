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

  it("positions the bento spans on the grid's own direct children, not on inner wrapper divs (design fidelity: main-stack card spans 2x2, learning-now card spans 2x1)", () => {
    const { container } = renderWithIntl();

    // grid-column/grid-row only apply to direct grid items — Reveal/Tilt
    // are the actual direct children of the grid, so the span classes
    // MUST live there, not on divs nested further inside them. Asserting
    // on inner divs (as a prior version of this test did) can pass while
    // the layout is silently broken, since dead CSS still exists in the
    // DOM — it just never applies.
    const grid = container.querySelector(".grid");
    expect(grid).not.toBeNull();

    const gridChildren = Array.from(grid?.children ?? []);
    expect(gridChildren.length).toBe(8); // main-stack card + 7 skill cards

    const mainStackCard = gridChildren[0];
    expect(mainStackCard).toHaveClass("md:col-span-2", "md:row-span-2");

    const learningCardIndex = gridChildren.findIndex((child) =>
      child.textContent?.includes("Next.js"),
    );
    expect(learningCardIndex).toBeGreaterThan(0);
    expect(gridChildren[learningCardIndex]).toHaveClass("md:col-span-2");
    expect(gridChildren[learningCardIndex]).not.toHaveClass(
      "md:row-span-2",
    );

    const defaultCards = gridChildren.filter(
      (_, index) => index !== 0 && index !== learningCardIndex,
    );
    for (const card of defaultCards) {
      expect(card).not.toHaveClass("md:col-span-2");
      expect(card).not.toHaveClass("md:row-span-2");
    }
  });

  it("renders the section eyebrow (coral dash + mono uppercase label) above the heading (design fidelity)", () => {
    renderWithIntl();

    expect(screen.getByText("Stack & tools")).toBeInTheDocument();
  });

  it("renders the heading word with a salmon highlight span (design fidelity)", () => {
    renderWithIntl();

    const heading = screen.getByRole("heading", { level: 2, name: /skills/i });
    const highlight = heading.querySelector(".bg-salmon");
    expect(highlight).not.toBeNull();
    expect(highlight).toHaveTextContent("Skills");
  });

  it("renders a decorative blurred coral circle on the main-stack card, which stays overflow-hidden and relatively positioned (design fidelity)", () => {
    const { container } = renderWithIntl();

    const mainStackCard = screen.getByText("Main stack").closest("div.bg-ink");
    expect(mainStackCard).toHaveClass("relative", "overflow-hidden");

    const circle = mainStackCard?.querySelector(".bg-coral.rounded-full");
    expect(circle).not.toBeNull();
    expect(circle).toHaveAttribute("aria-hidden", "true");
    void container;
  });

  it("renders the learning-now card's icon bare (no SkillBadge chrome), unlike every other card's boxed badge (design fidelity)", async () => {
    const { container } = renderWithIntl();

    await waitFor(() => {
      expect(
        container.querySelector('svg[data-icon="nextjs"]'),
      ).not.toBeNull();
    });

    const nextjsIcon = container.querySelector('svg[data-icon="nextjs"]');
    // A boxed SkillBadge wraps its icon in an `inline-flex ... rounded-md
    // border` span; the learning-now card's icon must NOT have that
    // ancestor — only the plain bare icon.
    expect(nextjsIcon?.closest("span.rounded-md")).toBeNull();
  });

  it("renders every skill icon bare — no boxed badge chrome anywhere in the section (design fidelity: 'iconos sueltos')", async () => {
    const { container } = renderWithIntl();

    await waitFor(() => {
      expect(container.querySelectorAll("svg[data-icon]")).toHaveLength(10);
    });

    // Not one icon in the section (main-stack card's react/typescript/
    // nodejs, or any of the seven skill cards) is wrapped in the old
    // 36px bordered/filled badge span — SkillBadge is bare now.
    expect(container.querySelector("span.rounded-md")).toBeNull();

    const mainStackIcons = ["react", "typescript", "nodejs"].map((name) =>
      container.querySelector(`svg[data-icon="${name}"]`),
    );
    for (const icon of mainStackIcons) {
      expect(icon).not.toBeNull();
      expect(icon).toHaveClass("h-6.5", "w-6.5");
      expect(icon?.closest("span")).toBeNull();
    }
  });

  it("uses 18px corner radius on the skills bento cards, matching the design (not the 16px rounded-2xl default)", () => {
    const { container } = renderWithIntl();

    const mainStackCard = screen.getByText("Main stack").closest("div.bg-ink");
    expect(mainStackCard).toHaveClass("rounded-[18px]");
    expect(mainStackCard).not.toHaveClass("rounded-2xl");

    const learningCard = screen
      .getByText("Next.js · App Router")
      .closest("div.bg-coral");
    expect(learningCard).toHaveClass("rounded-[18px]");
    expect(learningCard).not.toHaveClass("rounded-2xl");

    const defaultCard = screen.getByText("JavaScript").closest("div.bg-card");
    expect(defaultCard).toHaveClass("rounded-[18px]");
    expect(defaultCard).not.toHaveClass("rounded-2xl");
    void container;
  });

  it("uses 0.16em eyebrow letter-spacing, matching the design (not tracking-widest's 0.1em)", () => {
    renderWithIntl();

    const eyebrow = screen.getByText("Stack & tools");
    expect(eyebrow).toHaveClass("tracking-[0.16em]");
    expect(eyebrow).not.toHaveClass("tracking-widest");
  });
});
