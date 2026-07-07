import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mapEngagementWriteResultToResponse } from "@/features/engagement/application/map-engagement-write-result";
import { recordArticleView } from "@/features/engagement/application/record-article-view";
import { createDrizzleArticleViewRepository } from "@/features/engagement/infrastructure/drizzle-article-view-repository";
import { createMdxArticleSlugChecker } from "@/features/engagement/infrastructure/mdx-article-slug-checker";
import { getEnv } from "@/shared/config/env";
import { getDb } from "@/shared/db/client";
import { createDrizzleRateLimitRepository } from "@/shared/rate-limit/drizzle-rate-limit-repository";
import { deriveVisitorHash } from "@/shared/security/derive-visitor-hash";
import { hmacSha256Hex } from "@/shared/security/hmac-sha256";
import { resolveClientIp } from "@/shared/security/resolve-client-ip";

/**
 * Thin composition-root adapter (excluded from the coverage gate, same
 * basis as `app/api/contact/route.ts`). All branching logic lives in
 * `features/engagement/application/record-article-view`, which IS
 * covered; this handler only parses the request, derives `ip_hash`/
 * `visitor_hash`, wires concrete dependencies, and forwards the mapped
 * response.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody: unknown = await request.json().catch(() => null);

  const ip = resolveClientIp(request.headers);
  const userAgent = request.headers.get("user-agent") ?? "";
  const secret = getEnv().VISITOR_HASH_SECRET;
  const ipHash = hmacSha256Hex(ip, secret);
  const visitorHash = deriveVisitorHash(ip, userAgent, secret);
  const db = getDb();

  const result = await recordArticleView(
    {
      articleViewRepository: createDrizzleArticleViewRepository(db),
      rateLimitRepository: createDrizzleRateLimitRepository(db),
      articleSlugChecker: createMdxArticleSlugChecker(),
    },
    { rawBody, visitorHash, ipHash },
  );

  const { status, body } = mapEngagementWriteResultToResponse(result);
  return body ? NextResponse.json(body, { status }) : new NextResponse(null, { status });
}
