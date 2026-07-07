import type { GithubActivityClient } from "../domain/github-activity-client";
import type { GithubActivitySummary } from "../domain/github-activity-summary";

export type GithubActivityResult =
  | { kind: "available"; data: GithubActivitySummary }
  | { kind: "unavailable" };

export interface GetGithubActivityDeps {
  client: GithubActivityClient;
  /**
   * Absent token takes the identical fallback path as an API failure
   * (design.md GitHub Activity: "on API error/timeout, or when
   * GITHUB_TOKEN is absent, the use-case returns a cached/empty
   * result"; task 10.1's residual note).
   */
  token: string | undefined;
  username: string;
}

/**
 * Orchestrates the GitHub activity fetch with graceful degradation
 * (github-activity: Graceful Failure Handling). Never throws — a
 * missing token or a client failure both collapse to the same
 * `{ kind: "unavailable" }` result, so `ui` only branches on one shape.
 * Lives in `application` (not the `app/` composition root) specifically
 * so this branching logic stays inside the coverage-gated `src/**`
 * tree, matching the same rule already applied to contact/engagement/
 * search orchestration.
 */
export async function getGithubActivity(
  deps: GetGithubActivityDeps,
): Promise<GithubActivityResult> {
  if (!deps.token) {
    return { kind: "unavailable" };
  }

  try {
    const data = await deps.client.fetchActivity(deps.username);
    return { kind: "available", data };
  } catch {
    return { kind: "unavailable" };
  }
}
