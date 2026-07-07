import { locales } from "@/shared/i18n/routing";
import type { MdxLoader } from "@/shared/content/mdx-loader";
import type { ArticleSearchEntry } from "@/features/search/domain/article-search-repository";
import { stripMarkdownToText } from "./strip-markdown-to-text";

/**
 * Builds the full set of `article_search` entries from the current
 * content tree — one per (slug, locale) MDX file that actually exists
 * (search: Index Sync Full Reconcile). A slug/locale pair with no MDX
 * file (blog: Missing-Translation Fallback) is skipped, not represented
 * as an empty entry. Not classified under `boundaries/include`
 * (`scripts/**` is outside it), so importing `search/domain` here is
 * unrestricted by eslint-boundaries.
 */
export function collectSearchEntries(loader: MdxLoader): ArticleSearchEntry[] {
  const entries: ArticleSearchEntry[] = [];

  for (const slug of loader.getSlugs()) {
    for (const locale of locales) {
      const file = loader.readArticleFile(slug, locale);
      if (!file) {
        continue;
      }

      entries.push({
        slug,
        locale,
        title: file.frontmatter.title,
        description: file.frontmatter.description,
        category: file.frontmatter.category,
        bodyText: stripMarkdownToText(file.content),
      });
    }
  }

  return entries;
}
