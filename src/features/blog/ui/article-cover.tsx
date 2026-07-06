import { useTranslations } from "next-intl";

/**
 * Cover placeholder (design-reference: 16/9 offset-frame card above the
 * article body). No real cover images ship yet — same "placeholder now,
 * real asset later" pattern as `shared/ui/photo-frame`. Kept local to
 * `blog` rather than reusing `PhotoFrame` because the aspect ratio and
 * offset styling differ (16/9 double-offset frame vs. `PhotoFrame`'s
 * 4/5 single-offset frame).
 */
export function ArticleCover() {
  const t = useTranslations("blog");

  return (
    <div className="relative my-9 aspect-video w-full">
      <div
        aria-hidden
        className="absolute inset-0 translate-x-3 translate-y-3 rounded-xl border-2 border-frame"
      />
      <div
        className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-card shadow-[0_24px_50px_-24px_var(--shadow)]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, transparent 0 15px, color-mix(in srgb, var(--ink) 7%, transparent) 15px 16px)",
        }}
      >
        <span className="rounded-md border border-dashed border-line px-3 py-2 font-mono text-xs tracking-widest text-ink-faint uppercase">
          {t("coverPlaceholder")}
        </span>
      </div>
    </div>
  );
}
