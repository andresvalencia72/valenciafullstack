import { describe, expect, it } from "vitest";
import { calculateScrollProgress } from "./calculate-scroll-progress";

describe("calculateScrollProgress", () => {
  it("returns 0 at the top of the page", () => {
    expect(
      calculateScrollProgress({
        scrollTop: 0,
        scrollHeight: 3000,
        clientHeight: 1000,
      }),
    ).toBe(0);
  });

  it("returns 50 at the midpoint of the scrollable distance", () => {
    // scrollable distance = scrollHeight - clientHeight = 2000
    expect(
      calculateScrollProgress({
        scrollTop: 1000,
        scrollHeight: 3000,
        clientHeight: 1000,
      }),
    ).toBe(50);
  });

  it("returns 100 at the bottom of the page", () => {
    expect(
      calculateScrollProgress({
        scrollTop: 2000,
        scrollHeight: 3000,
        clientHeight: 1000,
      }),
    ).toBe(100);
  });

  it("clamps to 100 when scrollTop overshoots (elastic/bounce scrolling)", () => {
    expect(
      calculateScrollProgress({
        scrollTop: 2500,
        scrollHeight: 3000,
        clientHeight: 1000,
      }),
    ).toBe(100);
  });

  it("returns 0 when the page has no scrollable overflow (content fits viewport)", () => {
    expect(
      calculateScrollProgress({
        scrollTop: 0,
        scrollHeight: 800,
        clientHeight: 1000,
      }),
    ).toBe(0);
  });
});
