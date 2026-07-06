import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMdxLoader } from "./mdx-loader";
import { listPublishedArticles } from "./list-published-articles";

function writeArticle(
  root: string,
  slug: string,
  locale: "es" | "en",
  frontmatter: Record<string, unknown>,
  body = "Some article body content.",
) {
  const dir = path.join(root, slug);
  fs.mkdirSync(dir, { recursive: true });
  const yamlLines = Object.entries(frontmatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.map((v) => `"${v}"`).join(", ")}]`;
      }
      return `${key}: ${JSON.stringify(value)}`;
    })
    .join("\n");
  const raw = `---\n${yamlLines}\n---\n\n${body}\n`;
  fs.writeFileSync(path.join(dir, `${locale}.mdx`), raw, "utf8");
}

const baseFrontmatter = {
  title: "Clean Architecture in Next.js",
  description: "How screaming architecture keeps features independent.",
  category: "architecture",
};

describe("listPublishedArticles", () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "list-articles-test-"));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("returns an empty list when there are no articles (home-page: No articles exist)", () => {
    const loader = createMdxLoader(root);

    expect(listPublishedArticles(loader, "es")).toEqual([]);
  });

  it("excludes an article missing in the requested locale (home-page: Article missing a locale is excluded)", () => {
    writeArticle(root, "es-only", "es", { ...baseFrontmatter, date: "2026-06-01" });
    const loader = createMdxLoader(root);

    expect(listPublishedArticles(loader, "en")).toEqual([]);
    expect(listPublishedArticles(loader, "es")).toHaveLength(1);
  });

  it("maps frontmatter into a locale-appropriate summary (home-page: Articles list renders inline)", () => {
    writeArticle(root, "clean-architecture", "es", {
      ...baseFrontmatter,
      date: "2026-06-01",
    });
    const loader = createMdxLoader(root);

    const [summary] = listPublishedArticles(loader, "es");

    expect(summary).toMatchObject({
      slug: "clean-architecture",
      title: baseFrontmatter.title,
      description: baseFrontmatter.description,
      category: baseFrontmatter.category,
      date: "2026-06-01",
    });
    expect(summary.readingTimeMinutes).toBeGreaterThanOrEqual(1);
  });

  it("sorts articles latest-first by date", () => {
    writeArticle(root, "older", "es", { ...baseFrontmatter, date: "2026-01-01" });
    writeArticle(root, "newer", "es", { ...baseFrontmatter, date: "2026-06-01" });
    writeArticle(root, "newest", "es", { ...baseFrontmatter, date: "2026-07-01" });
    const loader = createMdxLoader(root);

    const slugs = listPublishedArticles(loader, "es").map((a) => a.slug);

    expect(slugs).toEqual(["newest", "newer", "older"]);
  });
});
