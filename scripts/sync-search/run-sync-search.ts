import type { MdxLoader } from "@/shared/content/mdx-loader";
import type { ArticleSearchRepository } from "@/features/search/domain/article-search-repository";
import { collectSearchEntries } from "./collect-search-entries";

export interface RunSyncSearchDeps {
  mdxLoader: MdxLoader;
  articleSearchRepository: ArticleSearchRepository;
}

export interface RunSyncSearchResult {
  reconciledCount: number;
}

/**
 * Testable core of `scripts/sync-search.ts` (task 8.1): collects the
 * current content tree's search entries and hands them to the
 * repository's full reconcile in one call, so the CLI entry point
 * itself stays a thin, injectable wiring shell (same "thin adapter,
 * testable core" split used by `app/api/*` route handlers).
 */
export async function runSyncSearch(
  deps: RunSyncSearchDeps,
): Promise<RunSyncSearchResult> {
  const entries = collectSearchEntries(deps.mdxLoader);
  await deps.articleSearchRepository.reconcile(entries);
  return { reconciledCount: entries.length };
}
