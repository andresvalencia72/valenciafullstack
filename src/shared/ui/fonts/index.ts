import localFont from "next/font/local";

/**
 * Display typeface for headings. Self-hosted via `next/font/local` from
 * font files downloaded from Fontshare (see `LICENSE.txt` in this
 * directory) — no remote `@font-face`/CDN fetch, per design.md's
 * Design System section.
 *
 * Weights: 500 (medium), 600 (semibold), 700 (bold).
 */
export const clashDisplay = localFont({
  src: [
    {
      path: "./clash-display/ClashDisplay-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./clash-display/ClashDisplay-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./clash-display/ClashDisplay-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
});

/**
 * Body typeface. Self-hosted via `next/font/local` from font files
 * downloaded from Fontshare (see `LICENSE.txt` in this directory).
 *
 * Weights: 400 (regular), 500 (medium), 600 (semibold).
 */
export const generalSans = localFont({
  src: [
    {
      path: "./general-sans/GeneralSans-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./general-sans/GeneralSans-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./general-sans/GeneralSans-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-body",
  display: "swap",
});
