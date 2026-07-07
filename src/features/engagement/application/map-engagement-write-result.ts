import type { EngagementWriteResult } from "./engagement-write-result";

export interface EngagementHttpResponse {
  status: number;
  body: Record<string, string> | null;
}

/**
 * Maps a `views`/`reactions` write use-case result to an HTTP
 * status/body pair (security: No PII or Internal Detail Leakage — every
 * body below is a fixed, generic literal, never derived from an error
 * object). `body: null` on 204 — an HTTP 204 response MUST NOT carry a
 * body. Kept in the `application` layer (not the route handler) so this
 * branching is covered by the `src/**` coverage gate.
 */
export function mapEngagementWriteResultToResponse(
  result: EngagementWriteResult,
): EngagementHttpResponse {
  switch (result.kind) {
    case "recorded":
      // Byte-identical for first write and duplicate — the response
      // never distinguishes the two cases (engagement spec).
      return { status: 204, body: null };
    case "invalid":
      return { status: 400, body: { status: "invalid" } };
    case "not-found":
      return { status: 404, body: { status: "not_found" } };
    case "rate-limited":
      return { status: 429, body: { status: "rate_limited" } };
    case "persistence-failed":
      return { status: 503, body: { status: "unavailable" } };
  }
}
