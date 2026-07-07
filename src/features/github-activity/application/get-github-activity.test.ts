import { describe, expect, it } from "vitest";
import type { GithubActivityClient } from "../domain/github-activity-client";
import type { GithubActivitySummary } from "../domain/github-activity-summary";
import { getGithubActivity } from "./get-github-activity";

const SUMMARY: GithubActivitySummary = {
  username: "andresvalencia72",
  publicRepoCount: 10,
  followerCount: 4,
  recentContributionCount: 7,
  topRepositories: [],
};

function createClient(behavior: "resolve" | "reject"): GithubActivityClient {
  return {
    async fetchActivity() {
      if (behavior === "reject") {
        throw new Error("GitHub API failed");
      }
      return SUMMARY;
    },
  };
}

describe("getGithubActivity", () => {
  it("returns available with the fetched data when a token is configured and the client succeeds (github-activity: Server-Side GitHub Data Fetch)", async () => {
    const result = await getGithubActivity({
      client: createClient("resolve"),
      token: "a-token",
      username: "andresvalencia72",
    });

    expect(result).toEqual({ kind: "available", data: SUMMARY });
  });

  it("returns unavailable without calling the client when the token is absent (github-activity: Graceful Failure Handling — missing token follows the same fallback path as an API failure)", async () => {
    let called = false;
    const client: GithubActivityClient = {
      async fetchActivity() {
        called = true;
        return SUMMARY;
      },
    };

    const result = await getGithubActivity({
      client,
      token: undefined,
      username: "andresvalencia72",
    });

    expect(result).toEqual({ kind: "unavailable" });
    expect(called).toBe(false);
  });

  it("returns unavailable when the client throws (github-activity: Graceful Failure Handling)", async () => {
    const result = await getGithubActivity({
      client: createClient("reject"),
      token: "a-token",
      username: "andresvalencia72",
    });

    expect(result).toEqual({ kind: "unavailable" });
  });
});
