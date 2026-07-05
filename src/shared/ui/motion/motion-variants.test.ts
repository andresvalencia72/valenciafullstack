import { describe, expect, it } from "vitest";
import {
  calculateMagneticOffset,
  calculateTilt,
  resolveRevealVariants,
} from "./motion-variants";

describe("resolveRevealVariants", () => {
  it("animates from a hidden/offset state when motion is not reduced", () => {
    const variants = resolveRevealVariants(false);

    expect(variants.initial).toEqual({ opacity: 0, y: 24 });
    expect(variants.animate).toEqual({ opacity: 1, y: 0 });
    expect(variants.transition.duration).toBeGreaterThan(0);
  });

  it("renders in its final state immediately when motion is reduced", () => {
    const variants = resolveRevealVariants(true);

    expect(variants.initial).toEqual({ opacity: 1, y: 0 });
    expect(variants.animate).toEqual({ opacity: 1, y: 0 });
    expect(variants.transition.duration).toBe(0);
  });
});

describe("calculateTilt", () => {
  it("returns no rotation when the pointer is at the exact center", () => {
    const result = calculateTilt(
      { x: 100, y: 50 },
      { width: 200, height: 100 },
    );

    expect(result).toEqual({ rotateX: 0, rotateY: 0 });
  });

  it("tilts toward the pointer, clamped to the max degrees", () => {
    // Pointer at the far right edge, vertically centered.
    const result = calculateTilt(
      { x: 200, y: 50 },
      { width: 200, height: 100 },
      10,
    );

    expect(result.rotateY).toBe(10);
    expect(result.rotateX).toBe(0);
  });

  it("tilts the opposite way for the opposite edge", () => {
    const result = calculateTilt(
      { x: 0, y: 50 },
      { width: 200, height: 100 },
      10,
    );

    expect(result.rotateY).toBe(-10);
  });
});

describe("calculateMagneticOffset", () => {
  it("returns no offset when the pointer is at the exact center", () => {
    const result = calculateMagneticOffset(
      { x: 100, y: 50 },
      { width: 200, height: 100 },
      0.3,
    );

    expect(result).toEqual({ x: 0, y: 0 });
  });

  it("pulls toward the pointer, scaled by strength", () => {
    const result = calculateMagneticOffset(
      { x: 200, y: 100 },
      { width: 200, height: 100 },
      0.3,
    );

    // Distance from center to edge is (100, 50); scaled by 0.3 -> (30, 15)
    expect(result).toEqual({ x: 30, y: 15 });
  });
});
