import { describe, expect, it, vi } from "vitest";
import type { MdxLoader } from "@/shared/content/mdx-loader";
import type { ArticleSearchRepository } from "@/features/search/domain/article-search-repository";
import { runSyncSearch } from "./run-sync-search";

function fakeLoader(overrides: Partial<MdxLoader> = {}): MdxLoader {
  return {
    getSlugs: () => [],
    readArticleFile: () => null,
    validateContentTree: () => {},
    ...overrides,
  };
}

describe("runSyncSearch", () => {
  it("collects entries from the loader and reconciles them via the repository (search: Index Sync Full Reconcile)", async () => {
    const reconcile = vi.fn().mockResolvedValue(undefined);
    const repository: ArticleSearchRepository = { reconcile, search: vi.fn() };
    const loader = fakeLoader({
      getSlugs: () => ["clean-architecture-nextjs"],
      readArticleFile: (slug, locale) =>
        locale === "es"
          ? {
              frontmatter: {
                title: "Arquitectura limpia",
                description: "Descripción",
                date: "2026-06-01",
                category: "architecture",
              },
              content: "Cuerpo del artículo.",
              readingTimeMinutes: 3,
            }
          : null,
    });

    const result = await runSyncSearch({
      mdxLoader: loader,
      articleSearchRepository: repository,
    });

    expect(reconcile).toHaveBeenCalledWith([
      expect.objectContaining({ slug: "clean-architecture-nextjs", locale: "es" }),
    ]);
    expect(result).toEqual({ reconciledCount: 1 });
  });

  it("reconciles an empty set (full prune) when there is no published content", async () => {
    const reconcile = vi.fn().mockResolvedValue(undefined);
    const repository: ArticleSearchRepository = { reconcile, search: vi.fn() };

    const result = await runSyncSearch({
      mdxLoader: fakeLoader(),
      articleSearchRepository: repository,
    });

    expect(reconcile).toHaveBeenCalledWith([]);
    expect(result).toEqual({ reconciledCount: 0 });
  });
});
