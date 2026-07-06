import { describe, expect, it } from "vitest";
import type {
  Article,
  ArticleLocale,
  ArticleRepository,
} from "../domain/article-repository";
import { getNextArticle } from "./get-next-article";

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    slug: "post",
    locale: "es",
    title: "Post",
    description: "Desc",
    date: "2026-06-01",
    category: "architecture",
    tags: [],
    readingTimeMinutes: 3,
    content: "content",
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

describe("getNextArticle use case", () => {
  it("returns the chronologically-next article's teaser", async () => {
    const repo = new FakeArticleRepository([
      makeArticle({ slug: "first", date: "2026-06-01", locale: "es" }),
      makeArticle({ slug: "second", date: "2026-06-15", locale: "es" }),
      makeArticle({ slug: "third", date: "2026-07-01", locale: "es" }),
    ]);

    const next = await getNextArticle(repo, "first", "es");

    expect(next?.slug).toBe("second");
  });

  it("wraps around to the first article when the current one is the newest", async () => {
    const repo = new FakeArticleRepository([
      makeArticle({ slug: "first", date: "2026-06-01", locale: "es" }),
      makeArticle({ slug: "second", date: "2026-06-15", locale: "es" }),
    ]);

    const next = await getNextArticle(repo, "second", "es");

    expect(next?.slug).toBe("first");
  });

  it("returns null when there is only one article", async () => {
    const repo = new FakeArticleRepository([
      makeArticle({ slug: "only", date: "2026-06-01", locale: "es" }),
    ]);

    const next = await getNextArticle(repo, "only", "es");

    expect(next).toBeNull();
  });

  it("falls back to the other locale when the requested locale is missing for a slug", async () => {
    const repo = new FakeArticleRepository([
      makeArticle({ slug: "first", date: "2026-06-01", locale: "es" }),
      makeArticle({ slug: "second", date: "2026-06-15", locale: "en" }),
    ]);

    const next = await getNextArticle(repo, "first", "es");

    expect(next?.slug).toBe("second");
    expect(next?.locale).toBe("en");
  });
});
