import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Magnetic } from "@/shared/ui/motion/magnetic";
import { Reveal } from "@/shared/ui/motion/reveal";
import { SocialIcon } from "./social-icon";

const SOCIAL_LINKS = [
  { key: "github" as const, href: "https://github.com/andresvalencia72" },
  {
    key: "linkedin" as const,
    href: "https://www.linkedin.com/in/andrés-felipe-valencia-ariza-b1009123a",
  },
  { key: "youtube" as const, href: "https://www.youtube.com/@codeink1" },
];

function boldChunk(chunks: React.ReactNode) {
  return <strong className="font-semibold text-ink">{chunks}</strong>;
}

interface ContactSectionProps {
  /**
   * The functional contact form (`features/contact/ui/ContactForm`),
   * composed at the `app/` level (home-page: Section Composition —
   * contact). `home/ui` never imports the `contact` feature directly —
   * cross-feature UI composition happens only through the `app/`
   * composition root, same rule as `home` never importing `blog`
   * (task 3b.2) — so `ContactSection` receives the form as `children`
   * instead.
   */
  children: ReactNode;
}

/**
 * Contact section (contact: Server-Side Input Validation — field shape
 * only; home-page: Section Composition — contact). Owns the heading/
 * copy/social-links column; the interactive form itself is injected via
 * `children` (see `ContactSectionProps`).
 */
export function ContactSection({ children }: ContactSectionProps) {
  const t = useTranslations("home.contact");

  return (
    <section
      id="contact"
      className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-20 lg:grid-cols-2 lg:gap-13 lg:px-8 lg:py-32"
    >
      <Reveal>
        <div className="flex flex-col gap-10 lg:gap-18">
          <div className="rounded-2xl border border-line bg-card p-7 lg:p-9">
            <h2 className="mb-5.5 font-display text-4xl leading-none font-bold tracking-tight lg:text-6xl">
              {t("heading")}.
            </h2>
            <p className="mb-3.5 max-w-md text-base leading-relaxed text-ink">
              {t("paragraph1")}
            </p>
            <p className="max-w-md text-sm leading-relaxed text-ink-soft">
              {t.rich("paragraph2", { strong: boldChunk })}
            </p>
          </div>

          <div>
            <p className="mb-3 max-w-64 text-sm text-ink-soft">
              {t.rich("altPrompt", { strong: boldChunk })}
            </p>
            <div className="flex gap-2.5">
              {SOCIAL_LINKS.map((social) => (
                <Magnetic key={social.key}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener"
                    aria-label={
                      social.key === "github"
                        ? "GitHub"
                        : social.key === "linkedin"
                          ? "LinkedIn"
                          : "YouTube"
                    }
                    className="grid h-12 w-12 place-items-center rounded-xl bg-ink text-bg transition-colors hover:bg-coral hover:text-coral-ink"
                  >
                    <SocialIcon name={social.key} />
                  </a>
                </Magnetic>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal>{children}</Reveal>
    </section>
  );
}
