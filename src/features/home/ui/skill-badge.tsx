import { LazyIcon } from "./icons/lazy-icon";
import type { IconName } from "./icons";

interface SkillBadgeProps {
  icon: IconName;
}

/**
 * Bare skill icon (devicon-derived, see icons/ and
 * docs/third-party-assets.md), rendered directly on the card at the
 * design-reference's `.pf-ic` size (`font-size:26px` — bare colored
 * glyph, no box/border/background) — design fidelity fix, "iconos
 * sueltos" (2026-07-08 Playwright computed-style comparison). This
 * component previously wrapped the icon in a 36px bordered/filled
 * badge span not present in the design; that chrome is now removed
 * entirely.
 *
 * Resolves the deviation this component originally documented: the
 * design-reference uses devicon's colored icon font, which would have
 * required either an external CDN (blocked by ADR-0007's
 * `style-src 'self'` CSP) or vendoring the entire multi-hundred-glyph
 * font. Instead, only the exact SVGs this page needs are vendored as
 * small React components and rendered directly — no font, no CDN.
 *
 * The icon itself renders via `LazyIcon` (client-mounted, dynamically
 * imported) rather than a direct `SKILL_ICONS[icon]` lookup — see
 * `icons/lazy-icon.tsx` for why (quality-pipeline: Lighthouse
 * Performance Budget, CRITICAL-2 resolve-blockers fix). Each vendored
 * icon component already carries its own `aria-hidden`/`focusable`
 * attributes, so no extra wrapper is needed for accessibility.
 */
export function SkillBadge({ icon }: SkillBadgeProps) {
  return <LazyIcon icon={icon} className="h-6.5 w-6.5" />;
}
