import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getArticleEngagementSummary } from "@/features/engagement/application/get-article-engagement-summary";
import { mapGetArticleEngagementSummaryResultToResponse } from "@/features/engagement/application/map-get-article-engagement-summary-result";
import { createDrizzleArticleReactionRepository } from "@/features/engagement/infrastructure/drizzle-article-reaction-repository";
import { createDrizzleArticleViewRepository } from "@/features/engagement/infrastructure/drizzle-article-view-repository";
import { createMdxArticleSlugChecker } from "@/features/engagement/infrastructure/mdx-article-slug-checker";
import { getEnv } from "@/shared/config/env";
import { getDb } from "@/shared/db/client";
import { createDrizzleRateLimitRepository } from "@/shared/rate-limit/drizzle-rate-limit-repository";
import { hmacSha256Hex } from "@/shared/security/hmac-sha256";
import { resolveClientIp } from "@/shared/security/resolve-client-ip";

interface EngagementSummaryRouteParams {
  slug: string;
}

interface EngagementSummaryRouteContext {
  params: Promise<EngagementSummaryRouteParams>;
}

/**
 * Thin composition-root adapter — see `app/api/engagement/views/route.ts`
 * for the shared rationale. Only this handler sets `Cache-Control` (an
 * HTTP transport concern, not business logic); all branching lives in
 * `features/engagement/application/get-article-engagement-summary`.
 */
export async function GET(
  request: NextRequest,
  { params }: EngagementSummaryRouteContext,
): Promise<NextResponse> {
  const { slug } = await params;

  const ip = resolveClientIp(request.headers);
  const ipHash = hmacSha256Hex(ip, getEnv().VISITOR_HASH_SECRET);
  const db = getDb();

  const result = await getArticleEngagementSummary(
    {
      articleViewRepository: createDrizzleArticleViewRepository(db),
      articleReactionRepository: createDrizzleArticleReactionRepository(db),
      rateLimitRepository: createDrizzleRateLimitRepository(db),
      articleSlugChecker: createMdxArticleSlugChecker(),
    },
    { slug, ipHash },
  );

  const { status, body, cacheControl } =
    mapGetArticleEngagementSummaryResultToResponse(result);
  const response = NextResponse.json(body, { status });
  if (cacheControl) {
    response.headers.set("Cache-Control", cacheControl);
  }
  return response;
}
