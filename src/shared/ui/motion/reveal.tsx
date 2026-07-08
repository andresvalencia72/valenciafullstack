"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { resolveRevealVariants } from "./motion-variants";
import { usePrefersReducedMotion } from "./prefers-reduced-motion";

interface RevealProps {
  children: ReactNode;
  /**
   * Optional sizing/layout classes forwarded to the wrapping element
   * (e.g. `md:col-span-2` to size this as a grid item — grid-column/
   * grid-row only apply to direct grid children, so callers placing
   * `Reveal` directly inside a grid MUST pass span classes here rather
   * than on an inner div).
   */
  className?: string;
}

/**
 * Reveals `children` as they scroll into view (design-system: Motion
 * Interactions). Renders in its final, visible state immediately — no
 * animation — when `prefers-reduced-motion: reduce` is active.
 */
export function Reveal({ children, className }: RevealProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const variants = resolveRevealVariants(prefersReducedMotion);

  return (
    <motion.div
      className={className}
      data-motion={prefersReducedMotion ? "reduced" : "active"}
      initial={variants.initial}
      whileInView={variants.animate}
      viewport={{ once: true, amount: 0.2 }}
      transition={variants.transition}
    >
      {children}
    </motion.div>
  );
}
