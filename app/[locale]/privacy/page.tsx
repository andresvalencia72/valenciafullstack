import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/shared/i18n/navigation";

/**
 * Contact/deletion-request inbox for privacy requests (contact:
 * Privacy Disclosure — "MUST state a contact email address"). A fixed
 * literal, not env-derived: this page is a fully static route and
 * `getEnv()` fails fast on a missing `DATABASE_URL`, which build-time
 * static generation MUST NOT require (design.md Persistence > Env
 * validation) — so this value cannot come from `shared/config/env.ts`.
 * Update to a real, monitored inbox before production launch.
 */
const PRIVACY_CONTACT_EMAIL = "privacy@valenciafullstack.dev";

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return { title: t("title") };
}

/**
 * Privacy disclosure page (contact: Privacy Disclosure). Describes
 * contact-message storage and hashed-visitor engagement dedupe, and
 * states a contact address for data-deletion requests.
 */
export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 lg:px-8 lg:py-24">
      <Link
        href="/"
        className="mb-8 inline-block text-sm text-ink-soft transition-colors hover:text-coral"
      >
        &larr; {t("title")}
      </Link>
      <h1 className="mb-6 font-display text-4xl font-bold tracking-tight lg:text-5xl">
        {t("title")}
      </h1>
      <p className="mb-8 max-w-2xl text-base leading-relaxed text-ink-soft">
        {t("intro")}
      </p>

      <section className="mb-8">
        <h2 className="mb-2 font-display text-xl font-semibold tracking-tight">
          {t("contactStorageHeading")}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
          {t("contactStorageBody")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 font-display text-xl font-semibold tracking-tight">
          {t("engagementHeading")}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
          {t("engagementBody")}
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-display text-xl font-semibold tracking-tight">
          {t("deletionHeading")}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
          {t("deletionBody", { email: PRIVACY_CONTACT_EMAIL })}
        </p>
      </section>
    </main>
  );
}
