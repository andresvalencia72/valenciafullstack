import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkillBadge } from "./skill-badge";

/**
 * SkillBadge now renders a real devicon-derived brand icon (see
 * icons/) instead of the historical monogram placeholder — the
 * deviation this component originally documented (self-hosting a
 * full icon font vs. a hand-typed monogram) is resolved by vendoring
 * only the SVGs actually needed.
 */
describe("SkillBadge", () => {
  it("renders the icon matching the given name, hidden from assistive tech", () => {
    const { container } = render(<SkillBadge icon="react" />);

    const svg = container.querySelector('svg[data-icon="react"]');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("applies the default tone classes by default", () => {
    const { container } = render(<SkillBadge icon="git" />);
    const badge = container.firstElementChild;

    expect(badge).toHaveClass("border-line", "bg-bg", "text-ink");
  });

  it("applies the inverted tone classes when tone='inverted'", () => {
    const { container } = render(<SkillBadge icon="docker" tone="inverted" />);
    const badge = container.firstElementChild;

    expect(badge).toHaveClass("border-transparent", "bg-bg/15", "text-bg");
  });
});
