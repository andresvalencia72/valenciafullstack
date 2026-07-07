import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mapSearchArticlesResultToResponse } from "@/features/search/application/map-search-articles-result";
import { searchArticles } from "@/features/search/application/search-articles";
import { createDrizzleArticleSearchRepository } from "@/features/search/infrastructure/drizzle-article-search-repository";
import { getEnv } from "@/shared/config/env";
import { getDb } from "@/shared/db/client";
import { createDrizzleRateLimitRepository } from "@/shared/rate-limit/drizzle-rate-limit-repository";
import { hmacSha256Hex } from "@/shared/security/hmac-sha256";
import { resolveClientIp } from "@/shared/security/resolve-client-ip";

/**
 * Thin composition-root adapter (design.md API Surface) — parses the
 * query string, wires the Drizzle repositories, and maps the use-case
 * result to a response. All branching (rate limit -> validate -> query)
 * lives in `features/search/application/search-articles`, keeping it
 * inside the coverage-gated `src/**` tree.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  const ip = resolveClientIp(request.headers);
  const ipHash = hmacSha256Hex(ip, getEnv().VISITOR_HASH_SECRET);
  const db = getDb();

  const result = await searchArticles(
    {
      articleSearchRepository: createDrizzleArticleSearchRepository(db),
      rateLimitRepository: createDrizzleRateLimitRepository(db),
    },
    {
      query: {
        q: searchParams.get("q") ?? "",
        locale: searchParams.get("locale") ?? "",
      },
      ipHash,
    },
  );

  const { status, body } = mapSearchArticlesResultToResponse(result);
  return NextResponse.json(body, { status });
}
