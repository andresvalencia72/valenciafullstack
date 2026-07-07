import { mdxLoader } from "@/shared/content/mdx-loader";
import { getDb } from "@/shared/db/client";
import { createDrizzleArticleSearchRepository } from "@/features/search/infrastructure/drizzle-article-search-repository";
import { runSyncSearch, type RunSyncSearchResult } from "./sync-search/run-sync-search";

/**
 * Build-time full-reconcile sync script (task 8.1; search: Index Sync
 * Full Reconcile). Wires the real MDX loader and the real Drizzle
 * repository into the testable `runSyncSearch` core — this file itself
 * stays a thin composition shell (mirrors `app/api/*` route handlers:
 * `next build`-time code, not covered by dedicated unit tests of its
 * own beyond the wiring assertion in `sync-search.test.ts`).
 *
 * Wired into the CI pipeline's e2e seed step and (per design.md
 * Persistence) the deploy pipeline order `migrate -> sync-search ->
 * deploy promote` — this repo has no separate deploy workflow yet, so
 * the only concrete wiring point today is `.github/workflows/ci.yml`'s
 * e2e job (see that file's "Sync search index" step).
 */
export async function runSyncSearchCli(): Promise<RunSyncSearchResult> {
  const db = getDb();
  const result = await runSyncSearch({
    mdxLoader,
    articleSearchRepository: createDrizzleArticleSearchRepository(db),
  });
  return result;
}

export interface RunSyncSearchCliIo {
  log: (message: string) => void;
  error: (message: string, cause: unknown) => void;
  exit: (code: number) => void;
}

const DEFAULT_IO: RunSyncSearchCliIo = {
  log: (message) => console.log(message),
  error: (message, cause) => console.error(message, cause),
  exit: (code) => process.exit(code),
};

/**
 * The actual CLI dispatch, extracted so it's directly testable with an
 * injected `runner`/`io` (same "thin adapter, testable core" split as
 * `runSyncSearchCli` itself) — only the trivial `isMainModule` guard
 * below stays untested, since it can't be exercised without actually
 * invoking `process.exit` under the test runner's own process.
 */
export async function main(
  runner: () => Promise<RunSyncSearchResult> = runSyncSearchCli,
  io: RunSyncSearchCliIo = DEFAULT_IO,
): Promise<void> {
  try {
    const { reconciledCount } = await runner();
    io.log(`sync-search: reconciled ${reconciledCount} article_search row(s).`);
    io.exit(0);
  } catch (error) {
    io.error("sync-search failed:", error);
    io.exit(1);
  }
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  void main();
}
