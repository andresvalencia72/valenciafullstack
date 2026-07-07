import { describe, expect, it, vi } from "vitest";
import { createGithubActivityClient } from "./create-github-activity-client";

function jsonResponse(body: unknown, init?: { status?: number }) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { "content-type": "application/json" },
  });
}

describe("createGithubActivityClient", () => {
  it("fetches profile, repositories, and recent events, mapping them into a GithubActivitySummary (github-activity: Server-Side GitHub Data Fetch)", async () => {
    const calls: string[] = [];
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (url.includes("/repos")) {
        return jsonResponse([
          {
            name: "valenciafullstack",
            html_url: "https://github.com/andresvalencia72/valenciafullstack",
            description: "Portfolio",
            stargazers_count: 3,
            language: "TypeScript",
          },
        ]);
      }
      if (url.includes("/events/public")) {
        return jsonResponse([{ type: "PushEvent" }, { type: "PushEvent" }]);
      }
      return jsonResponse({ public_repos: 12, followers: 5 });
    });

    const client = createGithubActivityClient({
      token: "test-token",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const result = await client.fetchActivity("andresvalencia72");

    expect(result).toEqual({
      username: "andresvalencia72",
      publicRepoCount: 12,
      followerCount: 5,
      recentContributionCount: 2,
      topRepositories: [
        {
          name: "valenciafullstack",
          url: "https://github.com/andresvalencia72/valenciafullstack",
          description: "Portfolio",
          stars: 3,
          language: "TypeScript",
        },
      ],
    });
    expect(calls.some((url) => url.includes("/users/andresvalencia72"))).toBe(true);
  });

  it("sends the token as a Bearer Authorization header on every request", async () => {
    const headersSeen: (HeadersInit | undefined)[] = [];
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      headersSeen.push(init?.headers);
      const url = String(_input);
      if (url.includes("/repos") || url.includes("/events/public")) {
        return jsonResponse([]);
      }
      return jsonResponse({ public_repos: 0, followers: 0 });
    });

    const client = createGithubActivityClient({
      token: "secret-token",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await client.fetchActivity("andresvalencia72");

    for (const headers of headersSeen) {
      expect(headers).toMatchObject({ Authorization: "Bearer secret-token" });
    }
  });

  it("throws when the GitHub API returns a non-OK response (github-activity: Graceful Failure Handling)", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ message: "Bad credentials" }, { status: 401 }));

    const client = createGithubActivityClient({
      token: "bad-token",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await expect(client.fetchActivity("andresvalencia72")).rejects.toThrow();
  });

  it("throws when the request times out (github-activity: Graceful Failure Handling)", async () => {
    const fetchImpl = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new Error("aborted"));
          });
        }),
    );

    const client = createGithubActivityClient({
      token: "test-token",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      timeoutMs: 5,
    });

    await expect(client.fetchActivity("andresvalencia72")).rejects.toThrow();
  });

  it("throws when the response payload does not match the expected shape", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ unexpected: true }));

    const client = createGithubActivityClient({
      token: "test-token",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await expect(client.fetchActivity("andresvalencia72")).rejects.toThrow();
  });
});
