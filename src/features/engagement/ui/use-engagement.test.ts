import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEngagement } from "./use-engagement";

const SLUG = "clean-architecture-nextjs";

function summaryResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

function noContentResponse() {
  return { ok: true, status: 204, json: async () => null };
}

function failedResponse(status = 503) {
  return { ok: false, status, json: async () => ({ status: "unavailable" }) };
}

describe("useEngagement (hook)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fires exactly one view POST after mount, targeting the pinned request contract (engagement: View triggered once per page load)", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === `/api/engagement/${SLUG}`) {
        return Promise.resolve(
          summaryResponse({ views: 0, reactions: { thumbs_up: 0, heart: 0, fire: 0 } }),
        );
      }
      return Promise.resolve(noContentResponse());
    });
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useEngagement(SLUG));

    await waitFor(() => {
      const viewCalls = fetchMock.mock.calls.filter(
        ([url]) => url === "/api/engagement/views",
      );
      expect(viewCalls).toHaveLength(1);
    });

    const [, requestInit] = fetchMock.mock.calls.find(
      ([url]) => url === "/api/engagement/views",
    ) as [string, RequestInit];
    expect(requestInit.method).toBe("POST");
    expect(JSON.parse(requestInit.body as string)).toEqual({ slug: SLUG });

    // Still exactly one, even after further renders/time.
    await new Promise((resolve) => setTimeout(resolve, 10));
    const viewCallsAfter = fetchMock.mock.calls.filter(
      ([url]) => url === "/api/engagement/views",
    );
    expect(viewCallsAfter).toHaveLength(1);
  });

  it("fetches and exposes the aggregate summary on success (engagement: Public Read of Aggregate Counts)", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === `/api/engagement/${SLUG}`) {
        return Promise.resolve(
          summaryResponse({
            views: 12,
            reactions: { thumbs_up: 1, heart: 2, fire: 0 },
          }),
        );
      }
      return Promise.resolve(noContentResponse());
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useEngagement(SLUG));

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    expect(result.current.views).toBe(12);
    expect(result.current.reactions).toEqual({ thumbs_up: 1, heart: 2, fire: 0 });
  });

  it("degrades to a hidden-counts state when the summary read fails (engagement: Graceful Degradation When Database Unavailable)", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === `/api/engagement/${SLUG}`) {
        return Promise.resolve(failedResponse());
      }
      return Promise.resolve(noContentResponse());
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useEngagement(SLUG));

    await waitFor(() => {
      expect(result.current.status).toBe("degraded");
    });

    expect(result.current.views).toBeNull();
    expect(result.current.reactions).toBeNull();
  });

  it("optimistically increments the reaction count and persists a local reacted flag on the first click (residual: optimistic increment + localStorage flag)", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === `/api/engagement/${SLUG}`) {
        return Promise.resolve(
          summaryResponse({
            views: 0,
            reactions: { thumbs_up: 0, heart: 0, fire: 0 },
          }),
        );
      }
      return Promise.resolve(noContentResponse());
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useEngagement(SLUG));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => {
      result.current.react("heart");
    });

    expect(result.current.reactions?.heart).toBe(1);
    expect(result.current.hasReacted("heart")).toBe(true);
    expect(window.localStorage.getItem(`engagement:reacted:${SLUG}:heart`)).toBe("1");

    await waitFor(() => {
      const reactionCalls = fetchMock.mock.calls.filter(
        ([url]) => url === "/api/engagement/reactions",
      );
      expect(reactionCalls).toHaveLength(1);
    });
    const [, requestInit] = fetchMock.mock.calls.find(
      ([url]) => url === "/api/engagement/reactions",
    ) as [string, RequestInit];
    expect(JSON.parse(requestInit.body as string)).toEqual({ slug: SLUG, kind: "heart" });
  });

  it("does not double-increment or re-POST when reacting again with an already-reacted kind (residual: local reacted flag blocks a repeat optimistic increment)", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === `/api/engagement/${SLUG}`) {
        return Promise.resolve(
          summaryResponse({
            views: 0,
            reactions: { thumbs_up: 0, heart: 0, fire: 0 },
          }),
        );
      }
      return Promise.resolve(noContentResponse());
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useEngagement(SLUG));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => result.current.react("fire"));
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.filter(([url]) => url === "/api/engagement/reactions"),
      ).toHaveLength(1);
    });

    act(() => result.current.react("fire"));

    expect(result.current.reactions?.fire).toBe(1);
    expect(
      fetchMock.mock.calls.filter(([url]) => url === "/api/engagement/reactions"),
    ).toHaveLength(1);
  });

  it("treats a throwing localStorage.getItem as 'not yet reacted' rather than crashing (triangulation: private-mode/disabled storage)", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === `/api/engagement/${SLUG}`) {
        return Promise.resolve(
          summaryResponse({ views: 0, reactions: { thumbs_up: 0, heart: 0, fire: 0 } }),
        );
      }
      return Promise.resolve(noContentResponse());
    });
    vi.stubGlobal("fetch", fetchMock);
    const getItemSpy = vi
      .spyOn(window.localStorage.__proto__, "getItem")
      .mockImplementation(() => {
        throw new Error("SecurityError");
      });

    const { result } = renderHook(() => useEngagement(SLUG));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(result.current.hasReacted("heart")).toBe(false);

    getItemSpy.mockRestore();
  });

  it("does not update state after the component unmounts mid-fetch (triangulation: cancelled effect cleanup)", async () => {
    let resolveSummary: (value: unknown) => void = () => {};
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === `/api/engagement/${SLUG}`) {
        return new Promise((resolve) => {
          resolveSummary = resolve;
        });
      }
      return Promise.resolve(noContentResponse());
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result, unmount } = renderHook(() => useEngagement(SLUG));
    expect(result.current.status).toBe("loading");

    unmount();
    await act(async () => {
      resolveSummary(
        summaryResponse({ views: 1, reactions: { thumbs_up: 0, heart: 0, fire: 0 } }),
      );
      await Promise.resolve();
    });

    // The hook unmounted before the fetch resolved — its `cancelled`
    // guard must prevent a "set state on an unmounted component"
    // update; `result.current` after unmount simply reflects the last
    // rendered value, which never advanced past "loading".
    expect(result.current.status).toBe("loading");
  });

  it("swallows a network failure on the view POST without affecting the summary read (triangulation: fire-and-forget error handling)", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === `/api/engagement/${SLUG}`) {
        return Promise.resolve(
          summaryResponse({ views: 3, reactions: { thumbs_up: 0, heart: 0, fire: 0 } }),
        );
      }
      if (url === "/api/engagement/views") {
        return Promise.reject(new Error("network down"));
      }
      return Promise.resolve(noContentResponse());
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useEngagement(SLUG));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.views).toBe(3);
  });

  it("swallows a network failure on the reaction POST, keeping the optimistic increment (triangulation: fire-and-forget error handling)", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === `/api/engagement/${SLUG}`) {
        return Promise.resolve(
          summaryResponse({ views: 0, reactions: { thumbs_up: 0, heart: 0, fire: 0 } }),
        );
      }
      if (url === "/api/engagement/reactions") {
        return Promise.reject(new Error("network down"));
      }
      return Promise.resolve(noContentResponse());
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useEngagement(SLUG));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => result.current.react("heart"));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.filter(([url]) => url === "/api/engagement/reactions"),
      ).toHaveLength(1);
    });
    expect(result.current.reactions?.heart).toBe(1);
  });

  it("restores the reacted flag from localStorage across a remount (residual: persisted reacted flag)", async () => {
    window.localStorage.setItem(`engagement:reacted:${SLUG}:thumbs_up`, "1");
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === `/api/engagement/${SLUG}`) {
        return Promise.resolve(
          summaryResponse({
            views: 0,
            reactions: { thumbs_up: 5, heart: 0, fire: 0 },
          }),
        );
      }
      return Promise.resolve(noContentResponse());
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useEngagement(SLUG));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(result.current.hasReacted("thumbs_up")).toBe(true);
    expect(result.current.hasReacted("heart")).toBe(false);
  });
});
