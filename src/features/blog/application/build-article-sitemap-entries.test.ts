import { describe, expect, it } from "vitest";
import { buildArticleSitemapEntries } from "./build-article-sitemap-entries";

const SITE_URL = "https://valenciafullstack.tech";

describe("buildArticleSitemapEntries", () => {
  it("emits an es and an en entry for a bilingual article, each declaring both hreflang alternates and x-default -> es (seo: Sitemap hreflang pairing, x-default hreflang present)", () => {
    const entries = buildArticleSitemapEntries(
      [{ slug: "my-post", availableLocales: ["es", "en"] }],
      SITE_URL,
    );

    expect(entries).toHaveLength(2);

    const es = entries.find((entry) => entry.locale === "es");
    const en = entries.find((entry) => entry.locale === "en");

    expect(es?.url).toBe("https://valenciafullstack.tech/es/blog/my-post");
    expect(es?.alternates.languages).toEqual({
      es: "https://valenciafullstack.tech/es/blog/my-post",
      en: "https://valenciafullstack.tech/en/blog/my-post",
      "x-default": "https://valenciafullstack.tech/es/blog/my-post",
    });

    expect(en?.url).toBe("https://valenciafullstack.tech/en/blog/my-post");
    expect(en?.alternates.languages).toEqual({
      es: "https://valenciafullstack.tech/es/blog/my-post",
      en: "https://valenciafullstack.tech/en/blog/my-post",
      "x-default": "https://valenciafullstack.tech/es/blog/my-post",
    });
  });

  it("emits only the es entry for an es-only article, self-referencing hreflang and x-default, no en alternate (seo: Article missing the en locale)", () => {
    const entries = buildArticleSitemapEntries(
      [{ slug: "es-only-post", availableLocales: ["es"] }],
      SITE_URL,
    );

    expect(entries).toHaveLength(1);
    const [entry] = entries;

    expect(entry.locale).toBe("es");
    expect(entry.url).toBe(
      "https://valenciafullstack.tech/es/blog/es-only-post",
    );
    expect(entry.alternates.languages).toEqual({
      es: "https://valenciafullstack.tech/es/blog/es-only-post",
      "x-default": "https://valenciafullstack.tech/es/blog/es-only-post",
    });
  });

  it("emits only the en entry for an en-only article, x-default -> en (not es), no es alternate (seo: Article missing the es locale)", () => {
    const entries = buildArticleSitemapEntries(
      [{ slug: "en-only-post", availableLocales: ["en"] }],
      SITE_URL,
    );

    expect(entries).toHaveLength(1);
    const [entry] = entries;

    expect(entry.locale).toBe("en");
    expect(entry.url).toBe(
      "https://valenciafullstack.tech/en/blog/en-only-post",
    );
    expect(entry.alternates.languages).toEqual({
      en: "https://valenciafullstack.tech/en/blog/en-only-post",
      "x-default": "https://valenciafullstack.tech/en/blog/en-only-post",
    });
  });

  it("flattens entries across multiple articles", () => {
    const entries = buildArticleSitemapEntries(
      [
        { slug: "bilingual-post", availableLocales: ["es", "en"] },
        { slug: "es-only-post", availableLocales: ["es"] },
      ],
      SITE_URL,
    );

    expect(entries).toHaveLength(3);
    expect(entries.map((entry) => `${entry.locale}:${entry.url}`)).toEqual([
      "es:https://valenciafullstack.tech/es/blog/bilingual-post",
      "en:https://valenciafullstack.tech/en/blog/bilingual-post",
      "es:https://valenciafullstack.tech/es/blog/es-only-post",
    ]);
  });

  it("returns no entries for an article with no available locales", () => {
    const entries = buildArticleSitemapEntries(
      [{ slug: "unpublished", availableLocales: [] }],
      SITE_URL,
    );

    expect(entries).toEqual([]);
  });
});
