import { useTranslations } from "next-intl";
import { Magnetic } from "@/shared/ui/motion/magnetic";
import { Tilt } from "@/shared/ui/motion/tilt";
import { PhotoFrame } from "@/shared/ui/photo-frame/photo-frame";
import { SocialIcon } from "./social-icon";

const SOCIAL_LINKS = [
  {
    key: "github" as const,
    href: "https://github.com/andresvalencia72",
  },
  {
    key: "linkedin" as const,
    href: "https://www.linkedin.com/in/andrés-felipe-valencia-ariza-b1009123a",
  },
  {
    key: "youtube" as const,
    href: "https://www.youtube.com/@codeink1",
  },
];

/**
 * Hero section (home-page: Section Composition — partial). Matches
 * design-reference/'s availability eyebrow, name reveal, highlighted
 * role, primary CTA, socials, and offset photo frame.
 */
export function HeroSection() {
  const t = useTranslations("home.hero");
  const fullName = `${t("firstName")} ${t("lastName")}`;

  return (
    <section
      id="home"
      aria-label={fullName}
      className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-32 pb-16 lg:grid-cols-2 lg:px-8 lg:pt-40"
    >
      <div>
        <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-ink-soft">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full bg-coral"
          />
          {t("eyebrow")}
        </span>

        <h1 className="font-display text-6xl leading-[0.96] font-bold tracking-tight lg:text-8xl">
          <span className="block">{t("firstName")}</span>
          <span className="block">{t("lastName")}</span>
        </h1>

        <p className="mt-7 max-w-md text-lg leading-relaxed lg:text-xl">
          <span className="relative font-semibold text-ink">
            {t("role")}
          </span>{" "}
          <span className="text-ink-soft">{t("description")}</span>
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3.5">
          <Magnetic>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6.5 py-3.5 text-sm font-semibold text-bg"
            >
              {t("ctaPrimary")}
            </a>
          </Magnetic>

          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.key}
                href={social.href}
                target="_blank"
                rel="noopener"
                aria-label={t(`social.${social.key}`)}
                className="grid h-11.5 w-11.5 place-items-center rounded-full border border-line text-ink transition-colors hover:border-coral hover:text-coral"
              >
                <SocialIcon name={social.key} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <Tilt>
        <PhotoFrame label={t("photoAlt")} offset="right" />
      </Tilt>
    </section>
  );
}
