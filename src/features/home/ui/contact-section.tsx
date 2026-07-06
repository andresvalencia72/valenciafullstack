import { useTranslations } from "next-intl";
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

/**
 * Contact section (contact: Server-Side Input Validation — field shape
 * only; home-page: Section Composition — contact). **Static shell for
 * PR3b**: fields render but the form does not submit anywhere yet — the
 * submit button is disabled and the connecting API route, validation,
 * and error handling ship in PR6 (task 6.4), which wires this exact
 * markup up to `POST /api/contact`.
 */
export function ContactSection() {
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

      <Reveal>
        {/* TODO(PR6, task 6.4): wire this form to POST /api/contact — Zod
         * validation, rate limiting, honeypot, and generic-only error
         * responses land there. Submit stays disabled until then. */}
        <form className="flex flex-col gap-4.5 rounded-2xl bg-ink p-7 text-bg lg:p-10">
          <h3 className="mb-1.5 font-display text-2xl font-semibold tracking-tight">
            {t("formHeading")}
          </h3>

          <label className="flex flex-col gap-2 font-mono text-xs tracking-wide text-bg/65 uppercase">
            {t("nameLabel")}
            <input
              type="text"
              name="name"
              placeholder={t("namePlaceholder")}
              disabled
              className="rounded-lg border border-bg/30 bg-transparent px-3.5 py-3 text-sm text-bg outline-none"
            />
          </label>

          <label className="flex flex-col gap-2 font-mono text-xs tracking-wide text-bg/65 uppercase">
            {t("emailLabel")}
            <input
              type="email"
              name="email"
              placeholder={t("emailPlaceholder")}
              disabled
              className="rounded-lg border border-bg/30 bg-transparent px-3.5 py-3 text-sm text-bg outline-none"
            />
          </label>

          <label className="flex flex-col gap-2 font-mono text-xs tracking-wide text-bg/65 uppercase">
            {t("messageLabel")}
            <textarea
              name="message"
              rows={5}
              placeholder={t("messagePlaceholder")}
              disabled
              className="resize-vertical rounded-lg border border-bg/30 bg-transparent px-3.5 py-3 text-sm text-bg outline-none"
            />
          </label>

          <button
            type="submit"
            disabled
            aria-describedby="contact-submit-todo"
            className="mt-1 inline-flex w-fit items-center gap-2 rounded-xl bg-coral px-7.5 py-4 text-sm font-semibold text-coral-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("submit")}
          </button>
          <p id="contact-submit-todo" className="text-xs text-bg/50">
            {t("submitTodo")}
          </p>
        </form>
      </Reveal>
    </section>
  );
}
