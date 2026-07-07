import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mapSubmitContactResultToResponse } from "@/features/contact/application/map-submit-contact-result";
import { submitContactMessage } from "@/features/contact/application/submit-contact-message";
import { createContactEmailSender } from "@/features/contact/infrastructure/create-contact-email-sender";
import { createDrizzleContactMessageRepository } from "@/features/contact/infrastructure/drizzle-contact-message-repository";
import { getEnv } from "@/shared/config/env";
import { getDb } from "@/shared/db/client";
import { createDrizzleRateLimitRepository } from "@/shared/rate-limit/drizzle-rate-limit-repository";
import { hmacSha256Hex } from "@/shared/security/hmac-sha256";
import { resolveClientIp } from "@/shared/security/resolve-client-ip";

/**
 * Thin composition-root adapter (excluded from the coverage gate —
 * quality-pipeline: Coverage Threshold). All branching logic (check
 * order, response mapping) lives in `features/contact/application`,
 * which IS covered; this handler only parses the request, wires
 * concrete dependencies, and forwards the mapped response. Verified
 * end to end via Playwright (task 6.5), not Vitest.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody: unknown = await request.json().catch(() => null);

  const ip = resolveClientIp(request.headers);
  const ipHash = hmacSha256Hex(ip, getEnv().VISITOR_HASH_SECRET);
  const db = getDb();

  const result = await submitContactMessage(
    {
      contactMessageRepository: createDrizzleContactMessageRepository(db),
      rateLimitRepository: createDrizzleRateLimitRepository(db),
      emailSender: createContactEmailSender(),
    },
    { rawBody, ipHash },
  );

  const { status, body } = mapSubmitContactResultToResponse(result);
  return NextResponse.json(body, { status });
}
