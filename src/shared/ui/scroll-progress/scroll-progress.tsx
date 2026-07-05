"use client";

import { useEffect, useState } from "react";
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
 * the home page (design-system: Scroll Progress Indicator).
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(() =>
    typeof document === "undefined" ? 0 : readScrollProgress(),
  );

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

  return (
    <div
      role="progressbar"
      aria-label="Page scroll progress"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ width: "100%" }}
    >
      <div style={{ width: `${progress}%` }} />
    </div>
  );
}
