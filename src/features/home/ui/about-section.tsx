import { useTranslations } from "next-intl";
import { Magnetic } from "@/shared/ui/motion/magnetic";
import { Reveal } from "@/shared/ui/motion/reveal";
import { Tilt } from "@/shared/ui/motion/tilt";
import { PhotoFrame } from "@/shared/ui/photo-frame/photo-frame";

function boldChunk(chunks: React.ReactNode) {
  return <strong className="font-semibold text-ink">{chunks}</strong>;
}

/**
 * About section (home-page: Section Composition — partial). Two-column
 * layout: offset photo frame + heading/copy/CTAs, matching
 * design-reference/'s "sobre" section.
 */
export function AboutSection() {
  const t = useTranslations("home.about");

  return (
    <section
      id="about"
      className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 lg:grid-cols-2 lg:px-8 lg:py-32"
    >
      <Reveal>
        <Tilt>
          <PhotoFrame label={t("photoAlt")} offset="left" />
        </Tilt>
      </Reveal>

      <Reveal>
        <div>
          <h2 className="mb-5.5 font-display text-4xl leading-none font-semibold tracking-tight lg:text-6xl">
            {t("heading")} <span className="text-ink">{t("name")}</span>.
          </h2>
          <p className="mb-4.5 max-w-xl text-base leading-relaxed text-ink-soft lg:text-lg">
            {t("paragraph1")}
          </p>
          <p className="mb-7.5 max-w-xl text-base leading-relaxed text-ink-soft lg:text-lg">
            {t.rich("paragraph2", { strong: boldChunk })}
          </p>
          <div className="flex flex-wrap gap-3">
            <Magnetic>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3.5 text-sm font-semibold text-coral-ink"
              >
                {t("ctaPrimary")}
              </a>
            </Magnetic>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3.5 text-sm font-semibold text-ink"
            >
              {t("ctaSecondary")}
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
