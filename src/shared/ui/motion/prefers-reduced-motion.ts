"use client";

import { useEffect, useState } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Pure read of a `MediaQueryList`-like value. Extracted from the hook
 * below so the OS-preference branching is directly unit testable
 * without mocking `window.matchMedia`.
 */
export function readPrefersReducedMotion(
  mediaQueryList: MediaQueryList | null,
): boolean {
  return mediaQueryList?.matches ?? false;
}

/**
 * Reports whether the visitor's OS/browser signals
 * `prefers-reduced-motion: reduce` (design-system: Motion Interactions
 * Respect Reduced Motion), reacting live to preference changes.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return readPrefersReducedMotion(window.matchMedia(REDUCED_MOTION_QUERY));
  });

  useEffect(() => {
    const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);

    function handleChange() {
      setPrefersReducedMotion(readPrefersReducedMotion(mediaQueryList));
    }

    handleChange();
    mediaQueryList.addEventListener("change", handleChange);

    return () => {
      mediaQueryList.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersReducedMotion;
}
