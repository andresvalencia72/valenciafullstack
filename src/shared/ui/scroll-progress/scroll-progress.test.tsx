import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ScrollProgress } from "./scroll-progress";

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
});
