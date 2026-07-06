import type { MdxLoader } from "@/shared/content/mdx-loader";
import type {
  Article,
  ArticleLocale,
  ArticleRepository,
} from "../domain/article-repository";

/**
 * `ArticleRepository` implementation backed by the shared MDX
 * filesystem loader (infrastructure: MDX filesystem loader — adapts
 * `shared/content`'s generic loader output into the `blog` feature's
 * own `Article` domain entity).
 */
export function createMdxArticleRepository(
  loader: MdxLoader,
): ArticleRepository {
  return {
    async findArticle(
      slug: string,
      locale: ArticleLocale,
    ): Promise<Article | null> {
      const file = loader.readArticleFile(slug, locale);
      if (!file) {
        return null;
      }

      return {
        slug,
        locale,
        title: file.frontmatter.title,
        description: file.frontmatter.description,
        date: file.frontmatter.date,
        category: file.frontmatter.category,
        tags: file.frontmatter.tags ?? [],
        cover: file.frontmatter.cover,
        readingTimeMinutes: file.readingTimeMinutes,
        content: file.content,
      };
    },

    async listSlugs(): Promise<string[]> {
      return loader.getSlugs();
    },
  };
}
