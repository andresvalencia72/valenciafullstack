interface SkillBadgeProps {
  label: string;
  tone?: "default" | "inverted";
}

/**
 * Monogram badge standing in for a technology's brand icon.
 *
 * Deviation from design-reference/ (documented, not silent): the
 * reference uses `devicon`'s colored icon font. Self-hosting devicon's
 * font/CSS would either pull an external CDN (blocked by ADR-0007's
 * `style-src 'self'` CSP) or vendor a large multi-hundred-glyph icon
 * font for eight icons. A hand-typed brand SVG per skill risks visual
 * inaccuracy. This monogram badge is a deliberate, swappable
 * placeholder — replacing it with real brand SVGs/devicon assets later
 * only touches this one file.
 */
export function SkillBadge({ label, tone = "default" }: SkillBadgeProps) {
  const toneClasses =
    tone === "inverted"
      ? "border-transparent bg-bg/15 text-bg"
      : "border-line bg-bg text-ink";

  return (
    <span
      aria-hidden
      className={`inline-flex h-9 items-center justify-center rounded-md border px-2 font-mono text-xs font-medium tracking-wide ${toneClasses}`}
    >
      {label}
    </span>
  );
}
