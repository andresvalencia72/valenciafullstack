import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ContentValidationError } from "./content-validation-error";
import { createMdxLoader } from "./mdx-loader";

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

const validFrontmatter = {
  title: "Clean Architecture in Next.js",
  description: "How screaming architecture keeps features independent.",
  date: "2026-06-14",
  category: "architecture",
  tags: ["nextjs", "architecture"],
};

describe("createMdxLoader", () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "mdx-loader-test-"));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("returns null for a slug/locale that has no MDX file", () => {
    const loader = createMdxLoader(root);

    expect(loader.readArticleFile("missing-post", "es")).toBeNull();
  });

  it("reads and validates a valid article file, computing reading time", () => {
    writeArticle(root, "clean-architecture", "es", validFrontmatter);
    const loader = createMdxLoader(root);

    const file = loader.readArticleFile("clean-architecture", "es");

    expect(file).not.toBeNull();
    expect(file?.frontmatter.title).toBe(validFrontmatter.title);
    expect(file?.frontmatter.category).toBe("architecture");
    expect(file?.frontmatter.tags).toEqual(["nextjs", "architecture"]);
    expect(file?.readingTimeMinutes).toBeGreaterThanOrEqual(1);
    expect(file?.content).toContain("Some article body content.");
  });

  it("throws ContentValidationError for invalid frontmatter (blog: Invalid frontmatter)", () => {
    writeArticle(root, "broken-post", "es", {
      title: "Missing required fields",
    });
    const loader = createMdxLoader(root);

    expect(() => loader.readArticleFile("broken-post", "es")).toThrow(
      ContentValidationError,
    );
  });

  it("lists slugs from directory names", () => {
    writeArticle(root, "post-a", "es", validFrontmatter);
    writeArticle(root, "post-b", "en", validFrontmatter);
    const loader = createMdxLoader(root);

    expect(loader.getSlugs().sort()).toEqual(["post-a", "post-b"]);
  });

  it("returns an empty slug list when the content root does not exist", () => {
    const loader = createMdxLoader(path.join(root, "does-not-exist"));

    expect(loader.getSlugs()).toEqual([]);
  });

  describe("validateContentTree", () => {
    it("passes for a valid single-locale article", () => {
      writeArticle(root, "clean-architecture", "es", validFrontmatter);
      const loader = createMdxLoader(root);

      expect(() => loader.validateContentTree()).not.toThrow();
    });

    it("passes for consistent bilingual siblings", () => {
      writeArticle(root, "clean-architecture", "es", validFrontmatter);
      writeArticle(root, "clean-architecture", "en", {
        ...validFrontmatter,
        title: "Clean Architecture in Next.js (EN)",
      });
      const loader = createMdxLoader(root);

      expect(() => loader.validateContentTree()).not.toThrow();
    });

    it("fails the build for a reserved slug (blog: Reserved slug rejected)", () => {
      writeArticle(root, "views", "es", validFrontmatter);
      const loader = createMdxLoader(root);

      expect(() => loader.validateContentTree()).toThrow(
        ContentValidationError,
      );
      expect(() => loader.validateContentTree()).toThrow(/reserved/i);
    });

    it("fails the build for an unknown category (blog: Category id with no catalog label fails the build)", () => {
      writeArticle(root, "mystery-post", "es", {
        ...validFrontmatter,
        category: "not-a-real-category",
      });
      const loader = createMdxLoader(root);

      expect(() => loader.validateContentTree()).toThrow(
        ContentValidationError,
      );
      expect(() => loader.validateContentTree()).toThrow(/category/i);
    });

    it("fails the build when locale siblings diverge on category (blog: Divergent category across locales fails the build)", () => {
      writeArticle(root, "clean-architecture", "es", validFrontmatter);
      writeArticle(root, "clean-architecture", "en", {
        ...validFrontmatter,
        category: "patterns",
      });
      const loader = createMdxLoader(root);

      expect(() => loader.validateContentTree()).toThrow(
        ContentValidationError,
      );
      expect(() => loader.validateContentTree()).toThrow(/category/i);
    });

    it("fails the build when locale siblings diverge on date", () => {
      writeArticle(root, "clean-architecture", "es", validFrontmatter);
      writeArticle(root, "clean-architecture", "en", {
        ...validFrontmatter,
        date: "2026-07-01",
      });
      const loader = createMdxLoader(root);

      expect(() => loader.validateContentTree()).toThrow(
        ContentValidationError,
      );
      expect(() => loader.validateContentTree()).toThrow(/date/i);
    });

    it("fails the build when locale siblings diverge on tags", () => {
      writeArticle(root, "clean-architecture", "es", validFrontmatter);
      writeArticle(root, "clean-architecture", "en", {
        ...validFrontmatter,
        tags: ["nextjs", "testing"],
      });
      const loader = createMdxLoader(root);

      expect(() => loader.validateContentTree()).toThrow(
        ContentValidationError,
      );
      expect(() => loader.validateContentTree()).toThrow(/tags/i);
    });

    it("does not fail when tags sibling arrays only differ in order", () => {
      writeArticle(root, "clean-architecture", "es", validFrontmatter);
      writeArticle(root, "clean-architecture", "en", {
        ...validFrontmatter,
        tags: ["architecture", "nextjs"],
      });
      const loader = createMdxLoader(root);

      expect(() => loader.validateContentTree()).not.toThrow();
    });
  });
});
