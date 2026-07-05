"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { calculateMagneticOffset } from "./motion-variants";
import { usePrefersReducedMotion } from "./prefers-reduced-motion";

interface MagneticProps {
  children: ReactNode;
  strength?: number;
}

const NEUTRAL_OFFSET = { x: 0, y: 0 };

/**
 * Wraps `children` in a pointer-driven magnetic pull effect
 * (design-system: Motion Interactions). Disabled entirely when
 * `prefers-reduced-motion: reduce` is active.
 */
export function Magnetic({ children, strength = 0.3 }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [offset, setOffset] = useState(NEUTRAL_OFFSET);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (prefersReducedMotion || !ref.current) {
      return;
    }

    const bounds = ref.current.getBoundingClientRect();
    setOffset(
      calculateMagneticOffset(
        { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
        { width: bounds.width, height: bounds.height },
        strength,
      ),
    );
  }

  function handlePointerLeave() {
    setOffset(NEUTRAL_OFFSET);
  }

  return (
    <div
      ref={ref}
      data-motion={prefersReducedMotion ? "reduced" : "active"}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: prefersReducedMotion
          ? undefined
          : "transform 150ms ease-out",
      }}
    >
      {children}
    </div>
  );
}
