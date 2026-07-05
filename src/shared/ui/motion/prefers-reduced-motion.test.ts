import { describe, expect, it } from "vitest";
import { readPrefersReducedMotion } from "./prefers-reduced-motion";

describe("readPrefersReducedMotion", () => {
  it("returns true when the media query matches", () => {
    expect(readPrefersReducedMotion({ matches: true } as MediaQueryList)).toBe(
      true,
    );
  });

  it("returns false when the media query does not match", () => {
    expect(
      readPrefersReducedMotion({ matches: false } as MediaQueryList),
    ).toBe(false);
  });

  it("returns false when no media query list is available (e.g. SSR)", () => {
    expect(readPrefersReducedMotion(null)).toBe(false);
  });
});
