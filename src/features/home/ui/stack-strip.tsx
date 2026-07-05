import { useTranslations } from "next-intl";

/**
 * Marquee-style band listing top-level capabilities, separated by a
 * coral diamond (design-reference: the strip between hero and about).
 */
export function StackStrip() {
  const t = useTranslations("home.stackStrip");
  const items = t.raw("items") as string[];

  return (
    <div className="border-y border-line bg-band px-4 py-5.5 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3.5 gap-y-3.5 font-display text-lg font-medium tracking-tight lg:text-xl">
        {items.map((item, index) => (
          <span key={item} className="flex items-center gap-3.5">
            {index > 0 && (
              <span aria-hidden className="text-coral">
                ◆
              </span>
            )}
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
