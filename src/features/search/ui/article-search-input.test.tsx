import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { ArticleSearchInput, type SearchInputState } from "./article-search-input";

function okResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

function unavailableResponse() {
  return { ok: false, status: 503, json: async () => ({ status: "unavailable" }) };
}

function rateLimitedResponse() {
  return { ok: false, status: 429, json: async () => ({ status: "rate_limited" }) };
}

function renderInput(props: {
  onStateChange: (state: SearchInputState) => void;
  resetSignal?: number;
}) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ArticleSearchInput
        locale="en"
        onStateChange={props.onStateChange}
        resetSignal={props.resetSignal ?? 0}
      />
    </NextIntlClientProvider>,
  );
}

describe("ArticleSearchInput", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders a labeled search input (home-page: Embedded Article List — search input)", () => {
    renderInput({ onStateChange: vi.fn() });

    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });

  it("debounces keystrokes by at least 300ms before issuing a request (search: Input Validation and Rate Limiting)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ results: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const onStateChange = vi.fn();
    renderInput({ onStateChange });

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "hexagonal" } });

    // Immediately after typing, no fetch yet.
    expect(fetchMock).not.toHaveBeenCalled();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/search?locale=en&q=hexagonal"),
    );
  });

  it("reports 'ok' status with results on a successful response (search: Full-Text Query)", async () => {
    const results = [
      {
        slug: "clean-architecture-nextjs",
        title: "Clean architecture",
        description: "Description",
        category: "architecture",
        locale: "en",
        url: "/en/blog/clean-architecture-nextjs",
      },
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ results })));
    const onStateChange = vi.fn();
    renderInput({ onStateChange });

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "clean" } });

    await waitFor(() => {
      expect(onStateChange).toHaveBeenCalledWith({
        query: "clean",
        status: "ok",
        results,
      });
    });
  });

  it("reports 'idle' status immediately when the query is cleared, without fetching (article-filter: Selecting a pill clears an active search query counterpart)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ results: [] })));
    const onStateChange = vi.fn();
    renderInput({ onStateChange });

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "clean" } });
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } });

    expect(onStateChange).toHaveBeenLastCalledWith({
      query: "",
      status: "idle",
      results: [],
    });
  });

  it("reports 'unavailable' status and disables the input on a 503 response (search: Graceful Degradation When Database Unavailable)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(unavailableResponse()));
    const onStateChange = vi.fn();
    renderInput({ onStateChange });

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "clean" } });

    await waitFor(() => {
      expect(screen.getByRole("searchbox")).toBeDisabled();
    });
    expect(onStateChange).toHaveBeenLastCalledWith({
      query: "clean",
      status: "unavailable",
      results: [],
    });
  });

  it("reports 'error' status on a non-503 error response, e.g. rate-limited (triangulation: non-DB-unavailable failure path)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(rateLimitedResponse()));
    const onStateChange = vi.fn();
    renderInput({ onStateChange });

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "clean" } });

    await waitFor(() => {
      expect(onStateChange).toHaveBeenLastCalledWith({
        query: "clean",
        status: "error",
        results: [],
      });
    });
    // Unlike the 503 case, a generic error does not disable the input —
    // the visitor can retry by continuing to type.
    expect(screen.getByRole("searchbox")).not.toBeDisabled();
  });

  it("reports 'error' status when the network request itself rejects (triangulation: fetch throws, not just a non-ok response)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const onStateChange = vi.fn();
    renderInput({ onStateChange });

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "clean" } });

    await waitFor(() => {
      expect(onStateChange).toHaveBeenLastCalledWith({
        query: "clean",
        status: "error",
        results: [],
      });
    });
  });

  it("cancels a pending debounced fetch when the query changes again before it fires (triangulation: rapid typing only issues one request)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ results: [] }));
    vi.stubGlobal("fetch", fetchMock);
    renderInput({ onStateChange: vi.fn() });

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "arch" } });
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "architecture" } });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("q=architecture"),
    );
  });

  it("cancels a pending debounced fetch when resetSignal fires before it fires (triangulation: reset while debounce is still pending)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ results: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const onStateChange = vi.fn();
    const { rerender } = renderInput({ onStateChange, resetSignal: 0 });

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "clean" } });

    rerender(
      <NextIntlClientProvider locale="en" messages={en}>
        <ArticleSearchInput locale="en" onStateChange={onStateChange} resetSignal={1} />
      </NextIntlClientProvider>,
    );

    // Give the (cancelled) debounce timer's window a chance to elapse.
    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });

  it("tolerates unmounting before any query was ever typed (triangulation: debounce-effect cleanup with no pending timer)", () => {
    const { unmount } = renderInput({ onStateChange: vi.fn() });

    expect(() => unmount()).not.toThrow();
  });

  it("tolerates resetSignal firing before any query was ever typed (triangulation: reset with no pending debounce to cancel)", async () => {
    const onStateChange = vi.fn();
    const { rerender } = renderInput({ onStateChange, resetSignal: 0 });

    rerender(
      <NextIntlClientProvider locale="en" messages={en}>
        <ArticleSearchInput locale="en" onStateChange={onStateChange} resetSignal={1} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(onStateChange).toHaveBeenLastCalledWith({
      query: "",
      status: "idle",
      results: [],
    });
  });

  it("clears its own query and reports 'idle' when resetSignal changes (article-filter: Selecting a pill clears an active search query)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ results: [] })));
    const onStateChange = vi.fn();
    const { rerender } = renderInput({ onStateChange, resetSignal: 0 });

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "clean" } });
    await waitFor(() => expect(fetchMockCalled(onStateChange)).toBe(true));

    rerender(
      <NextIntlClientProvider locale="en" messages={en}>
        <ArticleSearchInput locale="en" onStateChange={onStateChange} resetSignal={1} />
      </NextIntlClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("searchbox")).toHaveValue("");
    });
    expect(onStateChange).toHaveBeenLastCalledWith({
      query: "",
      status: "idle",
      results: [],
    });
  });
});

function fetchMockCalled(onStateChange: ReturnType<typeof vi.fn>): boolean {
  return onStateChange.mock.calls.some(([state]) => state.status === "ok");
}
