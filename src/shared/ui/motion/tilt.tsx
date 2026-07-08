"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { calculateTilt } from "./motion-variants";
import { usePrefersReducedMotion } from "./prefers-reduced-motion";

interface TiltProps {
  children: ReactNode;
  maxDegrees?: number;
  /**
   * Optional layout classes forwarded to the wrapping element (e.g.
   * `h-full` so a height set on an ancestor grid item keeps chaining
   * down to `children`, since this wrapper otherwise has no intrinsic
   * height of its own).
   */
  className?: string;
}

const NEUTRAL_TILT = { rotateX: 0, rotateY: 0 };

/**
 * Wraps `children` in a pointer-driven tilt effect (design-system:
 * Motion Interactions). Disabled entirely — no listeners attached, no
 * transform applied — when `prefers-reduced-motion: reduce` is active.
 */
export function Tilt({ children, maxDegrees = 10, className }: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [rotation, setRotation] = useState(NEUTRAL_TILT);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (prefersReducedMotion || !ref.current) {
      return;
    }

    const bounds = ref.current.getBoundingClientRect();
    setRotation(
      calculateTilt(
        { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
        { width: bounds.width, height: bounds.height },
        maxDegrees,
      ),
    );
  }

  function handlePointerLeave() {
    setRotation(NEUTRAL_TILT);
  }

  return (
    <div
      ref={ref}
      className={className}
      data-motion={prefersReducedMotion ? "reduced" : "active"}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        transform: `rotateX(${rotation.rotateX}deg) rotateY(${rotation.rotateY}deg)`,
        transition: prefersReducedMotion
          ? undefined
          : "transform 150ms ease-out",
      }}
    >
      {children}
    </div>
  );
}
