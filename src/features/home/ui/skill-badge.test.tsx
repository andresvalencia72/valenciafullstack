import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkillBadge } from "./skill-badge";

/**
 * SkillBadge renders the devicon-derived brand icon bare, at the
 * design-reference's `.pf-ic` size (26px, `font-size:26px` — the design
 * renders devicon glyphs directly on the card, no box/border/background
 * chrome around them). This resolves the "iconos sueltos" deviation
 * found by the 2026-07-08 Playwright computed-style comparison: prior
 * to this fix, every icon was wrapped in a 36px bordered/filled badge
 * span not present in the design.
 *
 * The icon itself loads via `LazyIcon` (dynamically imported,
 * client-mounted — see icons/lazy-icon.tsx), so its presence is
 * asserted with `waitFor` rather than synchronously.
 */
describe("SkillBadge", () => {
  it("renders the icon matching the given name, hidden from assistive tech", async () => {
    const { container } = render(<SkillBadge icon="react" />);

    await waitFor(() => {
      const svg = container.querySelector('svg[data-icon="react"]');
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("renders the icon bare at 26px, with no wrapping badge box", async () => {
    const { container } = render(<SkillBadge icon="git" />);

    await waitFor(() => {
      const svg = container.querySelector('svg[data-icon="git"]');
      expect(svg).not.toBeNull();
      expect(svg).toHaveClass("h-6.5", "w-6.5");
      // No box chrome: the icon must be the container's only/direct
      // child — no wrapping <span> carrying border/background classes.
      expect(container.querySelector("span")).toBeNull();
      expect(svg?.parentElement).toBe(container);
    });
  });
});
