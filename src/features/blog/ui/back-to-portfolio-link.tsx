import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/navigation";

/**
 * "Back to portfolio" link (design-reference: header + footer band).
 * Both instances point at the current locale's home page — there is no
 * blog index route to return to (blog: No Blog Index Route).
 */
export function BackToPortfolioLink() {
  const t = useTranslations("blog");

  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft no-underline hover:text-coral"
    >
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      {t("backToPortfolio")}
    </Link>
  );
}
