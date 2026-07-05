export interface Point {
  x: number;
  y: number;
}

export interface ElementBounds {
  width: number;
  height: number;
}

export interface RevealVariants {
  initial: { opacity: number; y: number };
  animate: { opacity: number; y: number };
  transition: { duration: number; ease?: "easeOut" };
}

/**
 * Resolves the reveal animation variants (design-system: Motion
 * Interactions). When `prefers-reduced-motion: reduce` is active, the
 * element renders in its final state immediately instead of animating
 * (per the Reduced Motion Preference Honored scenario).
 */
export function resolveRevealVariants(
  prefersReducedMotion: boolean,
): RevealVariants {
  if (prefersReducedMotion) {
    return {
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0 },
    };
  }

  return {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" },
  };
}

function clamp(value: number, max: number): number {
  return Math.min(Math.max(value, -max), max);
}

/**
 * Computes a tilt rotation (in degrees) from a pointer position relative
 * to an element's bounds, clamped to `maxDegrees`. Center of the element
 * yields no rotation; moving toward an edge tilts proportionally toward
 * that edge.
 */
export function calculateTilt(
  pointer: Point,
  bounds: ElementBounds,
  maxDegrees = 10,
): { rotateX: number; rotateY: number } {
  const centerX = bounds.width / 2;
  const centerY = bounds.height / 2;

  const ratioX = (pointer.x - centerX) / centerX;
  const ratioY = (pointer.y - centerY) / centerY;

  return {
    // Vertical pointer movement tilts around the X axis; horizontal
    // movement tilts around the Y axis. Vertical is inverted so moving
    // the pointer up tilts the top edge toward the viewer. The `+ 0`
    // normalizes a possible `-0` result (e.g. exact center) to `0`.
    rotateX: clamp(-ratioY * maxDegrees, maxDegrees) + 0,
    rotateY: clamp(ratioX * maxDegrees, maxDegrees) + 0,
  };
}

/**
 * Computes a magnetic translation offset that pulls an element toward
 * the pointer, scaled by `strength` (0-1).
 */
export function calculateMagneticOffset(
  pointer: Point,
  bounds: ElementBounds,
  strength = 0.3,
): Point {
  const centerX = bounds.width / 2;
  const centerY = bounds.height / 2;

  return {
    x: Math.round((pointer.x - centerX) * strength),
    y: Math.round((pointer.y - centerY) * strength),
  };
}
