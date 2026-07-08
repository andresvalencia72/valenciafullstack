"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/shared/ui/motion/prefers-reduced-motion";
import { calculateScrollProgress } from "./calculate-scroll-progress";

function readScrollProgress(): number {
  const { documentElement } = document;

  return calculateScrollProgress({
    scrollTop: documentElement.scrollTop,
    scrollHeight: documentElement.scrollHeight,
    clientHeight: documentElement.clientHeight,
  });
}

/**
 * Scroll progress indicator reflecting the visitor's scroll position on
 * the home page (design-system: Scroll Progress Indicator; design
 * fidelity: fixed, 3px, coral, full-width, driven by a `scaleX`
 * transform rather than an animated `width`, matching
 * design-reference/'s `data-progress` bar). Decorative/motion-adjacent,
 * so it's hidden entirely when `prefers-reduced-motion: reduce` is
 * active (design-system: Motion Interactions Respect Reduced Motion).
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(() =>
    typeof document === "undefined" ? 0 : readScrollProgress(),
  );
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    function handleScroll() {
      setProgress(readScrollProgress());
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div
      role="progressbar"
      aria-label="Page scroll progress"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed top-0 left-0 z-90 h-0.75 w-full origin-left bg-coral"
      style={{ transform: `scaleX(${progress / 100})` }}
    />
  );
}
