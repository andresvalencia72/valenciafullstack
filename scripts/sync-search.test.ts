import { afterEach, describe, expect, it, vi } from "vitest";

const reconcileMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@/shared/db/client", () => ({
  getDb: vi.fn().mockReturnValue({}),
}));

vi.mock("@/features/search/infrastructure/drizzle-article-search-repository", () => ({
  createDrizzleArticleSearchRepository: vi.fn().mockReturnValue({
    reconcile: reconcileMock,
    search: vi.fn(),
  }),
}));

describe("sync-search CLI entry", () => {
  afterEach(() => {
    reconcileMock.mockClear();
  });

  it("reconciles the real content tree via the injected repository (search: Index Sync Full Reconcile)", async () => {
    const { runSyncSearchCli } = await import("./sync-search");

    const result = await runSyncSearchCli();

    expect(reconcileMock).toHaveBeenCalledTimes(1);
    const [entries] = reconcileMock.mock.calls[0];
    // The real `content/blog/` tree ships >=3 bilingual sample articles
    // plus the es-only `notas-breves` fixture (see PR4 apply findings) —
    // asserting a real, non-trivial count proves this ran against actual
    // content, not an empty/mocked loader.
    expect(entries.length).toBeGreaterThanOrEqual(7);
    expect(result.reconciledCount).toBe(entries.length);
  });

  it("main() logs the reconciled count and exits 0 on success", async () => {
    const { main } = await import("./sync-search");
    const log = vi.fn();
    const error = vi.fn();
    const exit = vi.fn();

    await main(async () => ({ reconciledCount: 7 }), { log, error, exit });

    expect(log).toHaveBeenCalledWith("sync-search: reconciled 7 article_search row(s).");
    expect(exit).toHaveBeenCalledWith(0);
    expect(error).not.toHaveBeenCalled();
  });

  it("main() logs the failure and exits 1 when the runner throws (triangulation: failure path)", async () => {
    const { main } = await import("./sync-search");
    const log = vi.fn();
    const error = vi.fn();
    const exit = vi.fn();
    const failure = new Error("connection refused");

    await main(async () => {
      throw failure;
    }, { log, error, exit });

    expect(error).toHaveBeenCalledWith("sync-search failed:", failure);
    expect(exit).toHaveBeenCalledWith(1);
    expect(log).not.toHaveBeenCalled();
  });
});
