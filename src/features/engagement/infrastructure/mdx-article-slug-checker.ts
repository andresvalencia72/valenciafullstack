import { mdxLoader, type MdxLoader } from "@/shared/content/mdx-loader";
import type { ArticleSlugChecker } from "../domain/article-slug-checker";

/**
 * `ArticleSlugChecker` implementation backed by the shared MDX
 * filesystem loader (infrastructure: MDX filesystem loader — same
 * loader instance the PR4 article route's `generateStaticParams` uses,
 * so "published article set" has exactly one source of truth). Reads
 * `shared/content` (type `shared`), a structurally allowed
 * `infrastructure -> shared` edge — no cross-feature import of `blog`
 * itself.
 */
export function createMdxArticleSlugChecker(
  loader: MdxLoader = mdxLoader,
): ArticleSlugChecker {
  return {
    async isPublishedSlug(slug: string): Promise<boolean> {
      return loader.getSlugs().includes(slug);
    },
  };
}
