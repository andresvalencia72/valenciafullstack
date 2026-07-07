import { getGithubActivity } from "@/features/github-activity/application/get-github-activity";
import { GITHUB_USERNAME } from "@/features/github-activity/domain/github-username";
import { createGithubActivityClient } from "@/features/github-activity/infrastructure/create-github-activity-client";
import { GithubActivityPanel } from "@/features/github-activity/ui/github-activity-panel";
import { getEnv } from "@/shared/config/env";

/**
 * Composition root for the GitHub activity section (design.md: `app/*`
 * "MAY import feature `infrastructure` solely to instantiate
 * repositories and inject them into `application`"). An async Server
 * Component, meant to be rendered inside a `<Suspense>` boundary in
 * `page.tsx` so it streams independently and never blocks the rest of
 * the home page (github-activity: Non-Blocking Render; task 10.2's
 * residual note: "Suspense-streamed section with fetch-level revalidate
 * (3600), not page-level ISR").
 */
export async function GithubActivityAsync() {
  const token = getEnv().GITHUB_TOKEN;
  const client = createGithubActivityClient({ token: token ?? "" });

  const result = await getGithubActivity({
    client,
    token,
    username: GITHUB_USERNAME,
  });

  return <GithubActivityPanel result={result} />;
}
