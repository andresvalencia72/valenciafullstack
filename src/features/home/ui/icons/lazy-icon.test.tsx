import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LazyIcon } from "./lazy-icon";

/**
 * `LazyIcon` defers loading a brand SVG's markup until after the
 * initial client-side mount (quality-pipeline: Lighthouse Performance
 * Budget — CRITICAL-2 resolve-blockers fix). Devicon's vendored icons
 * are hand-drawn, geometry-heavy SVGs (~29KB combined across the 10
 * used on the skills section) — shipping all of them synchronously in
 * the initial SSR HTML measurably delays the home page's hero LCP
 * paint under Lighthouse's throttled-CPU mobile preset, even though
 * the icon components are plain Server Components and never ship as
 * part of the initial client JS bundle. Deferring the icon's own
 * markup to a dynamically-imported, client-mounted swap-in keeps the
 * initial HTML light while still rendering the exact same inline SVG
 * (no `<img>`, no external request) a moment after hydration.
 */
describe("LazyIcon", () => {
  it("renders nothing synchronously on mount", () => {
    const { container } = render(<LazyIcon icon="react" />);

    expect(container.querySelector("svg")).toBeNull();
  });

  it("renders the matching brand icon, decorative and stable, once loaded", async () => {
    const { container } = render(<LazyIcon icon="react" />);

    await waitFor(() => {
      expect(container.querySelector('svg[data-icon="react"]')).not.toBeNull();
    });

    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
  });

  it("forwards a className to the loaded icon for sizing", async () => {
    const { container } = render(
      <LazyIcon icon="typescript" className="h-5 w-5" />,
    );

    await waitFor(() => {
      expect(container.querySelector("svg")).not.toBeNull();
    });

    expect(container.querySelector("svg")).toHaveClass("h-5", "w-5");
  });
});
