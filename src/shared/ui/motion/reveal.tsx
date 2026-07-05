"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { resolveRevealVariants } from "./motion-variants";
import { usePrefersReducedMotion } from "./prefers-reduced-motion";

interface RevealProps {
  children: ReactNode;
}

/**
 * Reveals `children` as they scroll into view (design-system: Motion
 * Interactions). Renders in its final, visible state immediately — no
 * animation — when `prefers-reduced-motion: reduce` is active.
 */
export function Reveal({ children }: RevealProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const variants = resolveRevealVariants(prefersReducedMotion);

  return (
    <motion.div
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
