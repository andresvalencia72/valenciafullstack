import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePrefersReducedMotion } from "@/shared/ui/motion/prefers-reduced-motion";
import { ScrollProgress } from "./scroll-progress";

vi.mock("@/shared/ui/motion/prefers-reduced-motion", () => ({
  usePrefersReducedMotion: vi.fn(),
}));

function mockDocumentScrollMetrics({
  scrollTop,
  scrollHeight,
  clientHeight,
}: {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}) {
  Object.defineProperty(document.documentElement, "scrollTop", {
    configurable: true,
    value: scrollTop,
  });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    value: scrollHeight,
  });
  Object.defineProperty(document.documentElement, "clientHeight", {
    configurable: true,
    value: clientHeight,
  });
}

describe("ScrollProgress", () => {
  beforeEach(() => {
    vi.mocked(usePrefersReducedMotion).mockReturnValue(false);
    mockDocumentScrollMetrics({
      scrollTop: 0,
      scrollHeight: 3000,
      clientHeight: 1000,
    });
  });

  afterEach(() => {
    mockDocumentScrollMetrics({
      scrollTop: 0,
      scrollHeight: 0,
      clientHeight: 0,
    });
  });

  it("renders a progressbar starting at 0", () => {
    render(<ScrollProgress />);

    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "0");
  });

  it("updates to reflect the current scroll position on scroll", () => {
    render(<ScrollProgress />);

    mockDocumentScrollMetrics({
      scrollTop: 1000,
      scrollHeight: 3000,
      clientHeight: 1000,
    });

    act(() => {
      fireEvent.scroll(window);
    });

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "50",
    );
  });

  it("reaches 100 at the bottom of the page", () => {
    render(<ScrollProgress />);

    mockDocumentScrollMetrics({
      scrollTop: 2000,
      scrollHeight: 3000,
      clientHeight: 1000,
    });

    act(() => {
      fireEvent.scroll(window);
    });

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });

  it("is a fixed, 3px, coral bar driven by a scaleX transform (design fidelity: Scroll Progress)", () => {
    render(<ScrollProgress />);

    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveClass("fixed", "top-0", "left-0", "h-0.75", "bg-coral");
    expect(bar).toHaveStyle({ transform: "scaleX(0)" });
  });

  it("scales the bar to match the current scroll progress", () => {
    render(<ScrollProgress />);

    mockDocumentScrollMetrics({
      scrollTop: 1500,
      scrollHeight: 3000,
      clientHeight: 1000,
    });

    act(() => {
      fireEvent.scroll(window);
    });

    expect(screen.getByRole("progressbar")).toHaveStyle({
      transform: "scaleX(0.75)",
    });
  });

  it("is hidden when the visitor prefers reduced motion", () => {
    vi.mocked(usePrefersReducedMotion).mockReturnValue(true);

    render(<ScrollProgress />);

    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});
