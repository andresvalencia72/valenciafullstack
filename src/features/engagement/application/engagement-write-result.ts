/**
 * Shared result union for the `views` and `reactions` write use-cases
 * (record-article-view.ts, record-article-reaction.ts) — both endpoints
 * apply the identical rate-limit -> validate -> slug-check -> persist
 * orchestration and return the identical HTTP shape, per the engagement
 * spec (both "MUST return HTTP 204 No Content for both the first write
 * and any subsequent duplicate"). One shared type + one shared response
 * mapper avoids duplicating that mapping twice.
 */
export type EngagementWriteResult =
  | { kind: "recorded" }
  | { kind: "invalid" }
  | { kind: "not-found" }
  | { kind: "rate-limited" }
  | { kind: "persistence-failed" };
