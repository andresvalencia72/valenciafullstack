import { describe, expect, it } from "vitest";
import { mapEngagementWriteResultToResponse } from "./map-engagement-write-result";

describe("mapEngagementWriteResultToResponse", () => {
  it("maps 'recorded' to 204 with no body — success is never distinguishable from a duplicate (engagement: idempotent 204)", () => {
    expect(mapEngagementWriteResultToResponse({ kind: "recorded" })).toEqual({
      status: 204,
      body: null,
    });
  });

  it("maps 'invalid' to 400", () => {
    expect(mapEngagementWriteResultToResponse({ kind: "invalid" }).status).toBe(400);
  });

  it("maps 'not-found' to 404 (engagement: Unknown slug rejected)", () => {
    expect(mapEngagementWriteResultToResponse({ kind: "not-found" }).status).toBe(404);
  });

  it("maps 'rate-limited' to 429", () => {
    expect(mapEngagementWriteResultToResponse({ kind: "rate-limited" }).status).toBe(429);
  });

  it("maps 'persistence-failed' to 503 (engagement: Graceful Degradation When Database Unavailable)", () => {
    expect(
      mapEngagementWriteResultToResponse({ kind: "persistence-failed" }).status,
    ).toBe(503);
  });

  it("never includes PII or internal error detail in any error body (security: No PII or Internal Detail Leakage)", () => {
    for (const kind of ["invalid", "not-found", "rate-limited", "persistence-failed"] as const) {
      const { body } = mapEngagementWriteResultToResponse({ kind });
      expect(JSON.stringify(body)).not.toMatch(/error|stack|Error:/i);
    }
  });
});
