import { describe, expect, it } from "vitest";
import { resolveArticleSeoAlternates } from "./resolve-article-seo-alternates";

describe("resolveArticleSeoAlternates", () => {
  it("self-references and declares both locales, x-default -> es, for a bilingual article (seo: Hreflang alternates present)", () => {
    const result = resolveArticleSeoAlternates("es", ["es", "en"]);

    expect(result).toEqual({
      canonicalLocale: "es",
      hreflangLocales: ["es", "en"],
      xDefaultLocale: "es",
    });
  });

  it("canonical points to the content locale when the requested locale falls back (seo: Canonical points to available-content locale)", () => {
    const result = resolveArticleSeoAlternates("en", ["es"]);

    expect(result).toEqual({
      canonicalLocale: "es",
      hreflangLocales: ["es"],
      xDefaultLocale: "es",
    });
  });

  it("en-only article self-references with x-default -> en, no es alternate (seo: En-only article self-references)", () => {
    const result = resolveArticleSeoAlternates("en", ["en"]);

    expect(result).toEqual({
      canonicalLocale: "en",
      hreflangLocales: ["en"],
      xDefaultLocale: "en",
    });
  });
});
