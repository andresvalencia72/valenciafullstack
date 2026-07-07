import type { IconProps } from "./icon-props";

/**
 * Devicon `nextjs/nextjs-plain.svg` (MIT, devicon v2.17.0) — see
 * docs/third-party-assets.md for provenance. Decorative brand mark
 * only; the accessible label lives in the surrounding skill card.
 *
 * Unlike the other 9 vendored icons, this one uses the `-plain`
 * (not `-original`) variant: the Next.js wordmark has no inherent
 * brand color, and devicon's `-plain.svg` ships an unstyled path
 * (browser default fill: black), which is invisible against a dark
 * background. `fill="currentColor"` (added here, not present in the
 * upstream file) makes the mark inherit whatever text color the
 * surrounding tone context sets (e.g. the "Learning now" wide card's
 * `text-coral-ink`), so it stays legible in both themes without a
 * hardcoded color.
 */
export function NextjsIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 128 128"
      className={className}
      aria-hidden="true"
      focusable="false"
      data-icon="nextjs"
    >
      <path
        fill="currentColor"
        d="M64 0A64 64 0 0 0 0 64a64 64 0 0 0 64 64 64 64 0 0 0 35.508-10.838L47.014 49.34v40.238H38.4V38.4h10.768l57.125 73.584A64 64 0 0 0 128 64 64 64 0 0 0 64 0Zm17.777 38.4h8.534v48.776L81.777 75.97Zm24.18 73.92-.111.096a64 64 0 0 0 .111-.096z"
      />
    </svg>
  );
}
