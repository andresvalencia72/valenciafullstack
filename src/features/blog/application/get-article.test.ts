import { describe, expect, it } from "vitest";
import type {
  Article,
  ArticleLocale,
  ArticleRepository,
} from "../domain/article-repository";
import { getArticle } from "./get-article";

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    slug: "my-post",
    locale: "es",
    title: "Mi post",
    description: "Descripción",
    date: "2026-06-14",
    category: "architecture",
    tags: ["nextjs"],
    readingTimeMinutes: 3,
    content: "Contenido",
    ...overrides,
  };
}

class FakeArticleRepository implements ArticleRepository {
  constructor(private readonly articles: Article[]) {}

  async findArticle(
    slug: string,
    locale: ArticleLocale,
  ): Promise<Article | null> {
    return (
      this.articles.find((a) => a.slug === slug && a.locale === locale) ??
      null
    );
  }

  async listSlugs(): Promise<string[]> {
    return [...new Set(this.articles.map((a) => a.slug))];
  }
}

describe("getArticle use case", () => {
  it("returns kind=found when the requested locale exists (blog: Article renders in requested locale)", async () => {
    const repo = new FakeArticleRepository([
      makeArticle({ slug: "my-post", locale: "es" }),
    ]);

    const result = await getArticle(repo, "my-post", "es");

    expect(result.kind).toBe("found");
    if (result.kind === "found") {
      expect(result.article.locale).toBe("es");
    }
  });

  it("returns kind=fallback with the other locale's content when the requested locale is missing (blog: Missing-translation falls back)", async () => {
    const repo = new FakeArticleRepository([
      makeArticle({ slug: "my-post", locale: "es" }),
    ]);

    const result = await getArticle(repo, "my-post", "en");

    expect(result.kind).toBe("fallback");
    if (result.kind === "fallback") {
      expect(result.requestedLocale).toBe("en");
      expect(result.contentLocale).toBe("es");
      expect(result.article.locale).toBe("es");
    }
  });

  it("returns kind=not-found when neither locale has the slug (blog: Article missing in both locales)", async () => {
    const repo = new FakeArticleRepository([]);

    const result = await getArticle(repo, "missing-post", "es");

    expect(result.kind).toBe("not-found");
  });
});
