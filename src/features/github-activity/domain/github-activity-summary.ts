/**
 * A single repository surfaced in the GitHub activity section
 * (github-activity: Server-Side GitHub Data Fetch).
 */
export interface GithubRepositorySummary {
  name: string;
  url: string;
  description: string | null;
  stars: number;
  language: string | null;
}

/**
 * Server-fetched snapshot of a GitHub account's public activity
 * (github-activity: Server-Side GitHub Data Fetch). `recentContributionCount`
 * is derived from the account's recent public events — the REST API has
 * no public contributions-calendar endpoint (that data is GraphQL-only
 * and requires broader scopes), so this is the closest REST-only proxy
 * for "recent activity" (see infrastructure/create-github-activity-client.ts).
 */
export interface GithubActivitySummary {
  username: string;
  publicRepoCount: number;
  followerCount: number;
  recentContributionCount: number;
  topRepositories: GithubRepositorySummary[];
}
