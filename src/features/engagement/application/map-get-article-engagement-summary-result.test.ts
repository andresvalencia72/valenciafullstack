import { describe, expect, it } from "vitest";
import { mapGetArticleEngagementSummaryResultToResponse } from "./map-get-article-engagement-summary-result";

describe("mapGetArticleEngagementSummaryResultToResponse", () => {
  it("maps 'ok' to 200 with the {views, reactions} body and a 60s public cache header (engagement: Public Read of Aggregate Counts)", () => {
    const response = mapGetArticleEngagementSummaryResultToResponse({
      kind: "ok",
      views: 10,
      reactions: { thumbs_up: 1, heart: 2, fire: 0 },
    });

    expect(response).toEqual({
      status: 200,
      body: { views: 10, reactions: { thumbs_up: 1, heart: 2, fire: 0 } },
      cacheControl: "public, s-maxage=60",
    });
  });

  it("maps 'not-found' to 404 with no cache directive (engagement: Error responses are never cached)", () => {
    const response = mapGetArticleEngagementSummaryResultToResponse({ kind: "not-found" });

    expect(response.status).toBe(404);
    expect(response.cacheControl).toBeUndefined();
  });

  it("maps 'rate-limited' to 429 with no cache directive", () => {
    const response = mapGetArticleEngagementSummaryResultToResponse({
      kind: "rate-limited",
    });

    expect(response.status).toBe(429);
    expect(response.cacheControl).toBeUndefined();
  });

  it("maps 'unavailable' to 503 with no cache directive (engagement: Graceful Degradation When Database Unavailable)", () => {
    const response = mapGetArticleEngagementSummaryResultToResponse({
      kind: "unavailable",
    });

    expect(response.status).toBe(503);
    expect(response.cacheControl).toBeUndefined();
  });
});
