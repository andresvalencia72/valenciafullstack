import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Script from "next/script";
import type { ReactNode } from "react";
import { locales } from "@/shared/i18n/routing";
import { clashDisplay, generalSans } from "@/shared/ui/fonts";
import { buildThemeInitScript } from "@/shared/ui/theme/theme-init-script";
import "../globals.css";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "Andrés Valencia — Software Engineer",
  description:
    "Portfolio of Andrés Valencia: software engineering, architecture, and writing.",
};

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Locale root layout — composes fonts, the theme no-flash script, and
 * the i18n message provider (design.md: `app/[locale]/layout.tsx`).
 * This IS the app's root layout: `[locale]` is the top-level segment,
 * so `<html>`/`<body>` live here rather than in a separate
 * `app/layout.tsx`.
 */
export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${clashDisplay.variable} ${generalSans.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full antialiased">
        {/* `beforeInteractive` is injected into the served HTML ahead
         * of Next's own stylesheet `<link>` and executes before any
         * hydration (design-system: Theme Toggle — no flash of
         * incorrect theme). CSP allows 'unsafe-inline' script-src per
         * ADR-0007. */}
        <Script
          id="pf-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: buildThemeInitScript() }}
        />
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
