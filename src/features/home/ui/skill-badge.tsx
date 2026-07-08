import { LazyIcon } from "./icons/lazy-icon";
import type { IconName } from "./icons";

interface SkillBadgeProps {
  icon: IconName;
  tone?: "default" | "inverted";
}

/**
 * Brand-icon badge for a technology (devicon-derived, see icons/ and
 * docs/third-party-assets.md).
 *
 * Resolves the deviation this component previously documented: the
 * design-reference uses devicon's colored icon font, which would have
 * required either an external CDN (blocked by ADR-0007's
 * `style-src 'self'` CSP) or vendoring the entire multi-hundred-glyph
 * font. Instead, only the exact SVGs this page needs are vendored as
 * small React components and rendered directly — no font, no CDN.
 *
 * The icon itself renders via `LazyIcon` (client-mounted, dynamically
 * imported) rather than a direct `SKILL_ICONS[icon]` lookup — see
 * `icons/lazy-icon.tsx` for why (quality-pipeline: Lighthouse
 * Performance Budget, CRITICAL-2 resolve-blockers fix).
 */
export function SkillBadge({ icon, tone = "default" }: SkillBadgeProps) {
  const toneClasses =
    tone === "inverted"
      ? "border-transparent bg-bg/15 text-bg"
      : "border-line bg-bg text-ink";

  return (
    <span
      aria-hidden
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border p-1.5 ${toneClasses}`}
    >
      <LazyIcon icon={icon} />
    </span>
  );
}
