import { describe, expect, it } from "vitest";
import type { ArticleFile, MdxLoader } from "@/shared/content/mdx-loader";
import { collectSearchEntries } from "./collect-search-entries";

function fakeArticleFile(overrides: Partial<ArticleFile["frontmatter"]> & { content?: string } = {}): ArticleFile {
  const { content = "Body content.", ...frontmatterOverrides } = overrides;
  return {
    frontmatter: {
      title: "Title",
      description: "Description",
      date: "2026-06-01",
      category: "architecture",
      ...frontmatterOverrides,
    },
    content,
    readingTimeMinutes: 3,
  };
}

function fakeLoader(overrides: Partial<MdxLoader> = {}): MdxLoader {
  return {
    getSlugs: () => [],
    readArticleFile: () => null,
    validateContentTree: () => {},
    ...overrides,
  };
}

describe("collectSearchEntries", () => {
  it("builds one entry per (slug, locale) file that exists, with markdown stripped from the body", () => {
    const loader = fakeLoader({
      getSlugs: () => ["clean-architecture-nextjs"],
      readArticleFile: (slug, locale) => {
        if (slug !== "clean-architecture-nextjs") return null;
        return fakeArticleFile({
          title: locale === "es" ? "Arquitectura limpia" : "Clean architecture",
          content: "## Heading\n\nSome **bold** prose.",
        });
      },
    });

    const entries = collectSearchEntries(loader);

    expect(entries).toEqual([
      {
        slug: "clean-architecture-nextjs",
        locale: "es",
        title: "Arquitectura limpia",
        description: "Description",
        category: "architecture",
        bodyText: "Heading Some bold prose.",
      },
      {
        slug: "clean-architecture-nextjs",
        locale: "en",
        title: "Clean architecture",
        description: "Description",
        category: "architecture",
        bodyText: "Heading Some bold prose.",
      },
    ]);
  });

  it("skips locales that have no MDX file (blog: Missing-Translation Fallback) instead of producing a null entry", () => {
    const loader = fakeLoader({
      getSlugs: () => ["notas-breves"],
      readArticleFile: (slug, locale) => {
        if (slug === "notas-breves" && locale === "es") {
          return fakeArticleFile({ title: "Notas breves" });
        }
        return null;
      },
    });

    const entries = collectSearchEntries(loader);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ slug: "notas-breves", locale: "es" });
  });

  it("returns an empty array when there are no article slugs", () => {
    const entries = collectSearchEntries(fakeLoader());

    expect(entries).toEqual([]);
  });
});
