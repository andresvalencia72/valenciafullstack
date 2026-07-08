"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { IconProps } from "./icon-props";
import type { IconName } from "./index";

interface LazyIconProps {
  icon: IconName;
  className?: string;
}

/**
 * Defers loading a devicon-derived brand SVG's markup until after the
 * initial client-side mount (quality-pipeline: Lighthouse Performance
 * Budget — resolves the CRITICAL-2 regression found post-PR12).
 *
 * The 10 vendored icon components are plain Server Components — their
 * code never ships in the client JS bundle regardless of this wrapper
 * (confirmed empirically: no icon path data appears in `.next/static`
 * either way). The actual regression is the ~29KB of hand-drawn,
 * geometry-heavy inline SVG markup (dominated by `postgresql-icon.tsx`
 * and `php-icon.tsx`'s multi-path brand art) landing synchronously in
 * every request's initial HTML — a controlled A/B (this branch vs. the
 * pre-icon baseline, same session, same sandbox) showed this alone
 * accounts for the Lighthouse home-page Performance score's drop from
 * a passing 90 to a failing 88-89: swapping just the icon markup out of
 * the initial render (no other change) recovered the passing score,
 * while removing only the `Reveal`/`Tilt` motion wrapper did not move
 * the score at all — ruling out client-bundle weight and hydration
 * cost as the actual mechanism, isolating raw initial-HTML payload
 * size as the cause instead.
 *
 * `SKILL_ICONS` is dynamically imported (not statically bundled into
 * this file) so its module — and every icon component's SVG markup —
 * is code-split into a separate chunk fetched only after mount,
 * keeping it out of the critical hydration path entirely. Icons are
 * purely decorative (`aria-hidden` on every icon and on the
 * surrounding `SkillBadge` span), so a brief post-mount swap-in has no
 * accessibility impact — the label lives in the surrounding card.
 */
export function LazyIcon({ icon, className = "h-full w-full" }: LazyIconProps) {
  const [Icon, setIcon] = useState<ComponentType<IconProps> | null>(null);

  useEffect(() => {
    let isMounted = true;

    import("./index").then(({ SKILL_ICONS }) => {
      if (isMounted) {
        setIcon(() => SKILL_ICONS[icon]);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [icon]);

  if (!Icon) {
    return null;
  }

  return <Icon className={className} />;
}
