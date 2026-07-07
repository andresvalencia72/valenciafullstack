import { z } from "zod";
import type { GithubActivityClient } from "../domain/github-activity-client";
import type {
  GithubActivitySummary,
  GithubRepositorySummary,
} from "../domain/github-activity-summary";

const GITHUB_API_BASE = "https://api.github.com";
const DEFAULT_TIMEOUT_MS = 5000;
const TOP_REPOSITORY_COUNT = 6;
const RECENT_EVENTS_PAGE_SIZE = 100;

const githubProfileSchema = z.object({
  public_repos: z.number(),
  followers: z.number(),
});

const githubRepositorySchema = z.object({
  name: z.string(),
  html_url: z.string(),
  description: z.string().nullable(),
  stargazers_count: z.number(),
  language: z.string().nullable(),
});

const githubReposResponseSchema = z.array(githubRepositorySchema);

// The events payload's exact shape isn't consumed beyond its length (a
// proxy for "recent activity" — see the module doc comment below), so
// only the outer array shape is validated.
const githubEventsResponseSchema = z.array(z.unknown());

export interface CreateGithubActivityClientOptions {
  token: string;
  /** Injectable for tests; defaults to the global `fetch`. */
  fetchImpl?: typeof fetch;
  /** Per-request abort timeout in ms; defaults to 5000. */
  timeoutMs?: number;
}

/**
 * `GithubActivityClient` implementation backed by the real GitHub REST
 * API (github-activity: Server-Side GitHub Data Fetch). Three GET
 * requests — profile, top repositories (most recently pushed), and
 * recent public events (used as a lightweight "recent activity" proxy;
 * the REST API has no public contributions-calendar endpoint, that data
 * is GraphQL-only and needs broader scopes) — each cached at the fetch
 * level via `next.revalidate: 3600` (github-activity: ISR Caching —
 * task 10.2's residual note: "fetch-level revalidate, not page-level
 * ISR") and bounded by an `AbortController` timeout (github-activity:
 * Graceful Failure Handling — "on API error/timeout"). Zod validates
 * every response payload (design.md Technical Approach: "Zod validates
 * every boundary"). Any non-OK response, network error, timeout, or
 * malformed payload throws — `application/get-github-activity.ts` is
 * the single place that catches and degrades to the fallback state.
 */
export function createGithubActivityClient(
  options: CreateGithubActivityClientOptions,
): GithubActivityClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function fetchJson(
    path: string,
    searchParams?: Record<string, string>,
  ): Promise<unknown> {
    const url = new URL(`${GITHUB_API_BASE}${path}`);
    for (const [key, value] of Object.entries(searchParams ?? {})) {
      url.searchParams.set(key, value);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(url.toString(), {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${options.token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        signal: controller.signal,
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        throw new Error(
          `GitHub API request to ${path} failed with status ${response.status}`,
        );
      }

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    async fetchActivity(username: string): Promise<GithubActivitySummary> {
      const [profile, repos, events] = await Promise.all([
        fetchJson(`/users/${username}`).then((json) =>
          githubProfileSchema.parse(json),
        ),
        fetchJson(`/users/${username}/repos`, {
          sort: "pushed",
          per_page: String(TOP_REPOSITORY_COUNT),
          type: "owner",
        }).then((json) => githubReposResponseSchema.parse(json)),
        fetchJson(`/users/${username}/events/public`, {
          per_page: String(RECENT_EVENTS_PAGE_SIZE),
        }).then((json) => githubEventsResponseSchema.parse(json)),
      ]);

      const topRepositories: GithubRepositorySummary[] = repos.map((repo) => ({
        name: repo.name,
        url: repo.html_url,
        description: repo.description,
        stars: repo.stargazers_count,
        language: repo.language,
      }));

      return {
        username,
        publicRepoCount: profile.public_repos,
        followerCount: profile.followers,
        recentContributionCount: events.length,
        topRepositories,
      };
    },
  };
}
