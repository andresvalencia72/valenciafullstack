import { describe, expect, it } from "vitest";
import { buildRssFeed } from "./build-rss-feed";
import type { PublishedArticleSummary } from "./list-published-articles";

const SITE_URL = "https://valenciafullstack.tech";

function article(
  overrides: Partial<PublishedArticleSummary> = {},
): PublishedArticleSummary {
  return {
    slug: "my-post",
    title: "My Post",
    description: "A description",
    category: "engineering",
    date: "2026-01-15",
    readingTimeMinutes: 4,
    ...overrides,
  };
}

describe("buildRssFeed", () => {
  it("includes one item per article, using absolute URLs (seo: RSS feed lists articles)", () => {
    const xml = buildRssFeed({
      articles: [
        article({ slug: "post-a", title: "Post A" }),
        article({ slug: "post-b", title: "Post B" }),
      ],
      locale: "es",
      siteUrl: SITE_URL,
    });

    expect(xml).toContain("<item>");
    expect((xml.match(/<item>/g) ?? []).length).toBe(2);
    expect(xml).toContain(
      "<link>https://valenciafullstack.tech/es/blog/post-a</link>",
    );
    expect(xml).toContain(
      "<link>https://valenciafullstack.tech/es/blog/post-b</link>",
    );
  });

  it("sets the channel language to the requested locale (seo: channel language per feed)", () => {
    const esFeed = buildRssFeed({
      articles: [article()],
      locale: "es",
      siteUrl: SITE_URL,
    });
    const enFeed = buildRssFeed({
      articles: [article()],
      locale: "en",
      siteUrl: SITE_URL,
    });

    expect(esFeed).toContain("<language>es</language>");
    expect(enFeed).toContain("<language>en</language>");
  });

  it("escapes XML special characters in title and description", () => {
    const xml = buildRssFeed({
      articles: [
        article({
          title: "A & B <Report>",
          description: 'Quotes "here" and \'there\'',
        }),
      ],
      locale: "es",
      siteUrl: SITE_URL,
    });

    expect(xml).toContain("<title>A &amp; B &lt;Report&gt;</title>");
    expect(xml).toContain(
      "<description>Quotes &quot;here&quot; and &apos;there&apos;</description>",
    );
    expect(xml).not.toContain("<Report>");
  });

  it("produces a valid empty feed shell when no articles are given (seo: article missing a locale is excluded from that locale's feed)", () => {
    const xml = buildRssFeed({ articles: [], locale: "en", siteUrl: SITE_URL });

    expect(xml).not.toContain("<item>");
    expect(xml).toContain("<language>en</language>");
    expect(xml).toContain("<rss");
    expect(xml).toContain("</rss>");
  });
});
