interface PhotoFrameProps {
  /** Placeholder copy shown until a real photo is provided. */
  label: string;
  /** Which side the offset border frame sits on (design-reference: hero
   * offsets right/down, about offsets left/down). */
  offset: "left" | "right";
}

const OFFSET_TRANSLATE: Record<PhotoFrameProps["offset"], string> = {
  right: "translate-x-4 translate-y-4",
  left: "-translate-x-4 translate-y-4",
};

/**
 * Photo placeholder block: an offset border "frame" behind a hatch-pattern
 * card, matching `design-reference/`'s portrait placeholders. Real photos
 * replace the hatch pattern later; this component only ships the layout
 * and placeholder look.
 */
export function PhotoFrame({ label, offset }: PhotoFrameProps) {
  return (
    <div
      data-testid="photo-frame"
      data-offset={offset}
      className="relative aspect-4/5 w-full"
    >
      <div
        aria-hidden
        className={`absolute inset-0 rounded-lg border-2 border-frame ${OFFSET_TRANSLATE[offset]}`}
      />
      <div
        className="relative flex aspect-4/5 items-center justify-center overflow-hidden rounded-lg bg-card shadow-[0_24px_50px_-22px_var(--shadow)]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, transparent 0 13px, color-mix(in srgb, var(--ink) 7%, transparent) 13px 14px)",
        }}
      >
        <span className="rounded-md border border-dashed border-line px-3 py-2 font-mono text-xs tracking-widest text-ink-faint uppercase">
          {label}
        </span>
      </div>
    </div>
  );
}
