import { describe, expect, it } from "vitest";
import { mdxLoader } from "./mdx-loader";

/**
 * Validates the real `content/blog/` tree shipped with the repo — a
 * fast `npm test` guard that fails before a full `next build` would,
 * for the exact same reasons `generateStaticParams` would fail the
 * build (blog: Frontmatter Validation, Cross-Locale Frontmatter
 * Consistency, Reserved slug rejected, Category id with no catalog
 * label fails the build).
 */
describe("real content/blog tree", () => {
  it("passes full content validation", () => {
    expect(() => mdxLoader.validateContentTree()).not.toThrow();
  });

  it("ships at least the expected sample article slugs", () => {
    expect(mdxLoader.getSlugs().sort()).toEqual([
      "clean-architecture-nextjs",
      "design-patterns-daily",
      "notas-breves",
      "portfolio-tech-stack",
    ]);
  });
});
