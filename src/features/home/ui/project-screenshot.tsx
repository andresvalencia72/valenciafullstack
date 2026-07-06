interface ProjectScreenshotProps {
  /** Placeholder caption shown until a real screenshot is provided. */
  caption: string;
  /** Which side the offset border frame sits on, for the alternating
   * projects layout (home-page: Section Composition — projects). */
  offset: "left" | "right";
}

const OFFSET_TRANSLATE: Record<ProjectScreenshotProps["offset"], string> = {
  right: "translate-x-3.5 translate-y-3.5",
  left: "-translate-x-3.5 translate-y-3.5",
};

/**
 * Screenshot placeholder for a project card: an offset border "frame"
 * behind a 16/11 hatch-pattern card, matching `design-reference/`'s
 * project screenshot placeholders. Kept separate from `PhotoFrame`
 * (portrait 4/5 aspect, used by hero/about) since this is a distinct
 * wide aspect ratio with its own caption content.
 */
export function ProjectScreenshot({
  caption,
  offset,
}: ProjectScreenshotProps) {
  return (
    <div
      data-testid="project-screenshot"
      data-offset={offset}
      className="relative aspect-16/11 w-full"
    >
      <div
        aria-hidden
        className={`absolute inset-0 rounded-lg border-2 border-frame ${OFFSET_TRANSLATE[offset]}`}
      />
      <div
        className="relative flex aspect-16/11 items-center justify-center overflow-hidden rounded-lg bg-card shadow-[0_24px_50px_-24px_var(--shadow)]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, transparent 0 15px, color-mix(in srgb, var(--ink) 7%, transparent) 15px 16px)",
        }}
      >
        <span className="rounded-md border border-dashed border-line px-3 py-2 font-mono text-xs tracking-widest text-ink-faint uppercase">
          {caption}
        </span>
      </div>
    </div>
  );
}
