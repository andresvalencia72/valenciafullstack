import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { locales, type Locale } from "@/shared/i18n/routing";
import { isKnownArticleCategory } from "./categories";
import { ContentValidationError } from "./content-validation-error";
import { frontmatterSchema, type Frontmatter } from "./frontmatter-schema";
import { computeReadingTimeMinutes } from "./reading-time";
import { isReservedArticleSlug } from "./reserved-slugs";

export interface ArticleFile {
  frontmatter: Frontmatter;
  content: string;
  readingTimeMinutes: number;
}

export interface MdxLoader {
  /** Slugs discovered under the content root (one per article folder). */
  getSlugs(): string[];
  /**
   * Reads and validates a single locale's MDX file for `slug`. Returns
   * `null` when that locale's file does not exist (not an error by
   * itself — see `blog`: Missing-Translation Fallback). Throws
   * `ContentValidationError` when the file exists but its frontmatter is
   * invalid.
   */
  readArticleFile(slug: string, locale: Locale): ArticleFile | null;
  /**
   * Validates the entire content tree: reserved slugs, per-locale
   * frontmatter, category catalog membership, and cross-locale
   * consistency (blog: Frontmatter Validation, Cross-Locale Frontmatter
   * Consistency). Intended to run once during `next build` (wired into
   * the article route's `generateStaticParams`) so invalid content
   * fails the build.
   */
  validateContentTree(): void;
}

function tagsEqual(a: string[] = [], b: string[] = []): boolean {
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return JSON.stringify(sortedA) === JSON.stringify(sortedB);
}

export function createMdxLoader(contentRoot: string): MdxLoader {
  function getSlugs(): string[] {
    if (!fs.existsSync(contentRoot)) {
      return [];
    }
    return fs
      .readdirSync(contentRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  }

  function readArticleFile(slug: string, locale: Locale): ArticleFile | null {
    const filePath = path.join(contentRoot, slug, `${locale}.mdx`);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);
    const parsed = frontmatterSchema.safeParse(data);

    if (!parsed.success) {
      throw new ContentValidationError(
        `Invalid frontmatter for article "${slug}" (${locale}): ${parsed.error.message}`,
      );
    }

    return {
      frontmatter: parsed.data,
      content,
      readingTimeMinutes: computeReadingTimeMinutes(content),
    };
  }

  function validateContentTree(): void {
    for (const slug of getSlugs()) {
      if (isReservedArticleSlug(slug)) {
        throw new ContentValidationError(
          `Article slug "${slug}" is reserved (shadows an /api/engagement route) and MUST NOT be used.`,
        );
      }

      const filesByLocale = {} as Record<Locale, ArticleFile | null>;
      for (const locale of locales) {
        filesByLocale[locale] = readArticleFile(slug, locale);
      }

      const availableEntries = (
        Object.entries(filesByLocale) as [Locale, ArticleFile | null][]
      ).filter(
        (entry): entry is [Locale, ArticleFile] => entry[1] !== null,
      );

      if (availableEntries.length === 0) {
        throw new ContentValidationError(
          `Article "${slug}" has no MDX file in any supported locale.`,
        );
      }

      for (const [locale, file] of availableEntries) {
        if (!isKnownArticleCategory(file.frontmatter.category)) {
          throw new ContentValidationError(
            `Article "${slug}" (${locale}) has category "${file.frontmatter.category}", which has no corresponding i18n category catalog label.`,
          );
        }
      }

      if (availableEntries.length > 1) {
        const [, first] = availableEntries[0];
        for (const [locale, file] of availableEntries.slice(1)) {
          if (file.frontmatter.category !== first.frontmatter.category) {
            throw new ContentValidationError(
              `Article "${slug}" has divergent category across locales: locale siblings MUST agree on category (${locale} vs. ${availableEntries[0][0]}).`,
            );
          }
          if (file.frontmatter.date !== first.frontmatter.date) {
            throw new ContentValidationError(
              `Article "${slug}" has divergent date across locales: locale siblings MUST agree on date (${locale} vs. ${availableEntries[0][0]}).`,
            );
          }
          if (!tagsEqual(file.frontmatter.tags, first.frontmatter.tags)) {
            throw new ContentValidationError(
              `Article "${slug}" has divergent tags across locales: locale siblings MUST agree on tags (${locale} vs. ${availableEntries[0][0]}).`,
            );
          }
        }
      }
    }
  }

  return { getSlugs, readArticleFile, validateContentTree };
}

/** Default loader reading from `content/blog` at the repo root. */
export const mdxLoader: MdxLoader = createMdxLoader(
  path.join(process.cwd(), "content", "blog"),
);
