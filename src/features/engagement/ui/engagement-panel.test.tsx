import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { EngagementPanel } from "./engagement-panel";

const SLUG = "clean-architecture-nextjs";

function renderPanel() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <EngagementPanel slug={SLUG} />
    </NextIntlClientProvider>,
  );
}

function summaryResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

function noContentResponse() {
  return { ok: true, status: 204, json: async () => null };
}

describe("EngagementPanel", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the view count and each reaction's count once the summary loads (engagement: Public Read of Aggregate Counts)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url === `/api/engagement/${SLUG}`) {
          return Promise.resolve(
            summaryResponse({
              views: 12,
              reactions: { thumbs_up: 1, heart: 2, fire: 0 },
            }),
          );
        }
        return Promise.resolve(noContentResponse());
      }),
    );

    renderPanel();

    await waitFor(() => {
      expect(screen.getByText(/12/)).toBeInTheDocument();
    });
    expect(screen.getByTestId("reaction-count-heart")).toHaveTextContent("2");
  });

  it("hides counts (view count text and reaction badges) when the summary read fails (engagement: Graceful Degradation When Database Unavailable)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url === `/api/engagement/${SLUG}`) {
          return Promise.resolve({ ok: false, status: 503, json: async () => ({}) });
        }
        return Promise.resolve(noContentResponse());
      }),
    );

    renderPanel();

    await waitFor(() => {
      expect(screen.queryByTestId("reaction-count-heart")).not.toBeInTheDocument();
    });
    expect(screen.queryByText(/12/)).not.toBeInTheDocument();
  });

  it("fires exactly one view POST for the article on mount (engagement: View triggered once per page load)", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === `/api/engagement/${SLUG}`) {
        return Promise.resolve(
          summaryResponse({ views: 0, reactions: { thumbs_up: 0, heart: 0, fire: 0 } }),
        );
      }
      return Promise.resolve(noContentResponse());
    });
    vi.stubGlobal("fetch", fetchMock);

    renderPanel();

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.filter(([url]) => url === "/api/engagement/views"),
      ).toHaveLength(1);
    });
  });

  it("clicking a reaction button optimistically increments its count and marks it active (residual: optimistic increment + reacted flag)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url === `/api/engagement/${SLUG}`) {
          return Promise.resolve(
            summaryResponse({
              views: 0,
              reactions: { thumbs_up: 0, heart: 0, fire: 0 },
            }),
          );
        }
        return Promise.resolve(noContentResponse());
      }),
    );

    renderPanel();
    await waitFor(() => {
      expect(screen.getByTestId("reaction-count-fire")).toHaveTextContent("0");
    });

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /Fire/ }));
    });

    expect(screen.getByTestId("reaction-count-fire")).toHaveTextContent("1");
    expect(screen.getByRole("button", { name: /Fire/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
