import { describe, expect, it } from "vitest";
import type {
  Article,
  ArticleLocale,
  ArticleRepository,
} from "../domain/article-repository";
import { resolveAvailableArticleLocales } from "./resolve-available-locales";

function makeArticle(locale: ArticleLocale): Article {
  return {
    slug: "my-post",
    locale,
    title: `Title (${locale})`,
    description: "desc",
    date: "2026-01-01",
    category: "engineering",
    tags: [],
    readingTimeMinutes: 1,
    content: "body",
  };
}

function fakeRepository(availableLocales: ArticleLocale[]): ArticleRepository {
  return {
    async findArticle(_slug: string, locale: ArticleLocale) {
      return availableLocales.includes(locale) ? makeArticle(locale) : null;
    },
    async listSlugs() {
      return ["my-post"];
    },
  };
}

describe("resolveAvailableArticleLocales", () => {
  it("returns both locales for a bilingual article", async () => {
    const repository = fakeRepository(["es", "en"]);

    const result = await resolveAvailableArticleLocales(
      repository,
      "my-post",
      ["es", "en"],
    );

    expect(result).toEqual(["es", "en"]);
  });

  it("returns only the locale that has an MDX file (es-only)", async () => {
    const repository = fakeRepository(["es"]);

    const result = await resolveAvailableArticleLocales(
      repository,
      "my-post",
      ["es", "en"],
    );

    expect(result).toEqual(["es"]);
  });

  it("returns only the locale that has an MDX file (en-only)", async () => {
    const repository = fakeRepository(["en"]);

    const result = await resolveAvailableArticleLocales(
      repository,
      "my-post",
      ["es", "en"],
    );

    expect(result).toEqual(["en"]);
  });

  it("returns an empty array when the slug exists in neither candidate locale", async () => {
    const repository = fakeRepository([]);

    const result = await resolveAvailableArticleLocales(
      repository,
      "does-not-exist",
      ["es", "en"],
    );

    expect(result).toEqual([]);
  });
});
