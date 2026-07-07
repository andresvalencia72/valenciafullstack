import { describe, expect, it } from "vitest";
import type { MdxLoader } from "@/shared/content/mdx-loader";
import { createMdxArticleSlugChecker } from "./mdx-article-slug-checker";

function fakeLoader(slugs: string[]): MdxLoader {
  return {
    getSlugs: () => slugs,
    readArticleFile: () => null,
    validateContentTree: () => {},
  };
}

describe("createMdxArticleSlugChecker", () => {
  it("resolves true for a slug present in the loader's slug set (engagement: Endpoint Validation, Unknown Slug Rejection)", async () => {
    const checker = createMdxArticleSlugChecker(
      fakeLoader(["clean-architecture-nextjs", "portfolio-tech-stack"]),
    );

    await expect(checker.isPublishedSlug("clean-architecture-nextjs")).resolves.toBe(
      true,
    );
  });

  it("resolves false for a slug absent from the loader's slug set (triangulation)", async () => {
    const checker = createMdxArticleSlugChecker(fakeLoader(["clean-architecture-nextjs"]));

    await expect(checker.isPublishedSlug("does-not-exist")).resolves.toBe(false);
  });
});
