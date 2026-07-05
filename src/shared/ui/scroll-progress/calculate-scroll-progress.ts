export interface ScrollMetrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

/**
 * Computes scroll progress as a percentage (0-100), per design-system:
 * Scroll Progress Indicator.
 *
 * Pure function so it can be unit tested without a DOM scroll container;
 * the component wires it to `scroll`/resize events.
 */
export function calculateScrollProgress({
  scrollTop,
  scrollHeight,
  clientHeight,
}: ScrollMetrics): number {
  const scrollableDistance = scrollHeight - clientHeight;

  if (scrollableDistance <= 0) {
    return 0;
  }

  const ratio = scrollTop / scrollableDistance;
  const clamped = Math.min(Math.max(ratio, 0), 1);

  return Math.round(clamped * 100);
}
