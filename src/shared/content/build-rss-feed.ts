import type { Locale } from "@/shared/i18n/routing";
import type { PublishedArticleSummary } from "./list-published-articles";

export interface BuildRssFeedInput {
  /** Articles to list, already filtered to `locale` (see `listPublishedArticles`). */
  articles: PublishedArticleSummary[];
  locale: Locale;
  siteUrl: string;
}

const CHANNEL_TITLE: Record<Locale, string> = {
  es: "Andrés Valencia — Blog",
  en: "Andrés Valencia — Blog",
};

const CHANNEL_DESCRIPTION: Record<Locale, string> = {
  es: "Artículos sobre ingeniería de software, arquitectura y escritura técnica.",
  en: "Articles on software engineering, architecture, and technical writing.",
};

/** Minimal RSS 2.0 entity escaping — the five XML predefined entities. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildItem(article: PublishedArticleSummary, locale: Locale, siteUrl: string): string {
  const url = new URL(`/${locale}/blog/${article.slug}`, siteUrl).toString();
  const pubDate = new Date(article.date).toUTCString();

  return [
    "  <item>",
    `    <title>${escapeXml(article.title)}</title>`,
    `    <link>${url}</link>`,
    `    <guid>${url}</guid>`,
    `    <description>${escapeXml(article.description)}</description>`,
    `    <category>${escapeXml(article.category)}</category>`,
    `    <pubDate>${pubDate}</pubDate>`,
    "  </item>",
  ].join("\n");
}

/**
 * Builds a well-formed RSS 2.0 XML string for a single locale's article
 * feed (seo: RSS Feed) — `articles` MUST already be filtered to the
 * locale that has an MDX file (per `listPublishedArticles`); this
 * function never adds fallback entries for a missing translation, it
 * only renders whatever list it is given. Channel `<language>` is set
 * to `locale`, matching the "channel language per feed" requirement.
 */
export function buildRssFeed({ articles, locale, siteUrl }: BuildRssFeedInput): string {
  const channelLink = new URL(`/${locale}`, siteUrl).toString();
  const items = articles.map((article) => buildItem(article, locale, siteUrl)).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "<channel>",
    `  <title>${escapeXml(CHANNEL_TITLE[locale])}</title>`,
    `  <link>${channelLink}</link>`,
    `  <description>${escapeXml(CHANNEL_DESCRIPTION[locale])}</description>`,
    `  <language>${locale}</language>`,
    items,
    "</channel>",
    "</rss>",
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}
