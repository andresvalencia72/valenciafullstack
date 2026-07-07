import { expect, test } from "@playwright/test";

/**
 * seo: Dynamic OG Images, RSS Feed, Bilingual Sitemap with Hreflang.
 * i18n: SEO Metadata Consistency, unknown locale segments return 404.
 * Fixture content: `clean-architecture-nextjs` (bilingual),
 * `notas-breves` (es-only, per `e2e/blog.spec.ts`).
 */
test.describe("seo pack", () => {
  test("generates an OG image for a bilingual article in both locales (seo: OG image for article)", async ({
    request,
  }) => {
    const es = await request.get(
      "/es/blog/clean-architecture-nextjs/opengraph-image",
    );
    const en = await request.get(
      "/en/blog/clean-architecture-nextjs/opengraph-image",
    );

    expect(es.status()).toBe(200);
    expect(es.headers()["content-type"]).toContain("image/png");
    expect(en.status()).toBe(200);
    expect(en.headers()["content-type"]).toContain("image/png");
  });

  test("serves the content locale's OG image for a missing-translation fallback (seo: OG image for missing-translation fallback)", async ({
    request,
  }) => {
    const response = await request.get(
      "/en/blog/notas-breves/opengraph-image",
    );

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
  });

  test("returns 404 for an OG image of an unknown slug", async ({
    request,
  }) => {
    const response = await request.get(
      "/es/blog/does-not-exist/opengraph-image",
    );

    expect(response.status()).toBe(404);
  });

  test("es and en RSS feeds are well-formed XML with the matching channel language (seo: RSS feed lists articles)", async ({
    request,
  }) => {
    const es = await request.get("/es/rss.xml");
    const en = await request.get("/en/rss.xml");

    expect(es.status()).toBe(200);
    expect(es.headers()["content-type"]).toContain("application/rss+xml");
    const esBody = await es.text();
    expect(esBody).toContain("<language>es</language>");
    expect(esBody).toContain("clean-architecture-nextjs");
    expect(esBody).toContain("notas-breves");

    expect(en.status()).toBe(200);
    const enBody = await en.text();
    expect(enBody).toContain("<language>en</language>");
    expect(enBody).toContain("clean-architecture-nextjs");
  });

  test("excludes an article missing that locale's translation from the feed (seo: Article missing a locale is excluded from that locale's feed)", async ({
    request,
  }) => {
    const response = await request.get("/en/rss.xml");
    const body = await response.text();

    expect(body).not.toContain("notas-breves");
  });

  test("returns 404 for an unknown locale segment on the RSS route", async ({
    request,
  }) => {
    const response = await request.get("/fr/rss.xml");

    expect(response.status()).toBe(404);
  });

  test("sitemap declares hreflang pairing for a bilingual article, including x-default -> es (seo: Sitemap hreflang pairing)", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");

    expect(response.status()).toBe(200);
    const body = await response.text();

    expect(body).toContain("/es/blog/clean-architecture-nextjs");
    expect(body).toContain("/en/blog/clean-architecture-nextjs");
    expect(body).toMatch(
      /<xhtml:link rel="alternate" hreflang="x-default"[^>]*href="[^"]*\/es\/blog\/clean-architecture-nextjs"/,
    );
  });

  test("sitemap excludes the missing locale for an es-only article (seo: Article missing the en locale)", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    const body = await response.text();

    expect(body).toContain("/es/blog/notas-breves");
    expect(body).not.toContain("/en/blog/notas-breves");
  });
});
