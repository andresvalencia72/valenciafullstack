import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { clashDisplay, generalSans } from "@/shared/ui/fonts";
import { buildThemeInitScript } from "@/shared/ui/theme/theme-init-script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Andrés Valencia — Software Engineer",
  description:
    "Portfolio of Andrés Valencia: software engineering, architecture, and writing.",
};

/**
 * Interim root layout — wires design tokens, self-hosted fonts, and
 * the theme no-flash script (design-system: Theme Toggle) ahead of
 * the i18n shell landing in PR2b.
 *
 * This is a TEMPORARY shim: PR2b replaces this file with
 * `app/[locale]/layout.tsx` (next-intl's locale segment becomes the
 * true root layout) and deletes this one. It intentionally mirrors
 * PR1's plain, unlocalized structure so PR2a can ship and be reviewed
 * independently of the i18n routing work.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
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
        {children}
      </body>
    </html>
  );
}
