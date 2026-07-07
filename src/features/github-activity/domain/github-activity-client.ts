import type { GithubActivitySummary } from "./github-activity-summary";

/**
 * Port for fetching a GitHub account's public activity
 * (github-activity: Server-Side GitHub Data Fetch). `application`
 * depends only on this interface; `infrastructure/create-github-activity-client.ts`
 * is the real implementation against the GitHub REST API.
 */
export interface GithubActivityClient {
  fetchActivity(username: string): Promise<GithubActivitySummary>;
}
