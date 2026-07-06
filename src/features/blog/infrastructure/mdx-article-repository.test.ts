import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMdxLoader } from "@/shared/content/mdx-loader";
import { createMdxArticleRepository } from "./mdx-article-repository";

function writeArticle(
  root: string,
  slug: string,
  locale: "es" | "en",
  body = "Some article body content that is reasonably long for reading time.",
) {
  const dir = path.join(root, slug);
  fs.mkdirSync(dir, { recursive: true });
  const raw = `---\ntitle: "Clean Architecture"\ndescription: "A description"\ndate: "2026-06-14"\ncategory: "architecture"\ntags: ["nextjs"]\n---\n\n${body}\n`;
  fs.writeFileSync(path.join(dir, `${locale}.mdx`), raw, "utf8");
}

describe("createMdxArticleRepository", () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "mdx-article-repo-test-"));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("returns null when no file exists for the slug/locale", async () => {
    const repository = createMdxArticleRepository(createMdxLoader(root));

    const article = await repository.findArticle("missing", "es");

    expect(article).toBeNull();
  });

  it("maps a loaded MDX file into a domain Article entity", async () => {
    writeArticle(root, "clean-architecture", "es");
    const repository = createMdxArticleRepository(createMdxLoader(root));

    const article = await repository.findArticle("clean-architecture", "es");

    expect(article).not.toBeNull();
    expect(article).toMatchObject({
      slug: "clean-architecture",
      locale: "es",
      title: "Clean Architecture",
      description: "A description",
      date: "2026-06-14",
      category: "architecture",
      tags: ["nextjs"],
    });
    expect(article?.readingTimeMinutes).toBeGreaterThanOrEqual(1);
    expect(article?.content).toContain("Some article body content");
  });

  it("lists slugs via the underlying loader", async () => {
    writeArticle(root, "post-a", "es");
    writeArticle(root, "post-b", "en");
    const repository = createMdxArticleRepository(createMdxLoader(root));

    const slugs = await repository.listSlugs();

    expect(slugs.sort()).toEqual(["post-a", "post-b"]);
  });
});
