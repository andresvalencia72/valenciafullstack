import { z } from "zod";

/**
 * Server-side runtime environment schema.
 *
 * IMPORTANT: this module MUST NOT be imported at module scope by any
 * build-time code path (e.g. `next.config.ts`, `generateStaticParams`,
 * or any code executed during `next build`). Validation is deferred to
 * first access via `getEnv()` so that `next build` never requires
 * `DATABASE_URL` / `VISITOR_HASH_SECRET` to be set. Only server runtime
 * code (route handlers, server actions, request-scoped code) should call
 * `getEnv()`.
 *
 * `DATABASE_URL` and `VISITOR_HASH_SECRET` are required — the process
 * fails fast the first time `getEnv()` is called if either is missing.
 * `RESEND_API_KEY` and `GITHUB_TOKEN` are optional; each feature degrades
 * gracefully at runtime when they are absent (see design.md Persistence
 * and GitHub Activity sections).
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  VISITOR_HASH_SECRET: z.string().min(1, "VISITOR_HASH_SECRET is required"),
  RESEND_API_KEY: z.string().min(1).optional(),
  GITHUB_TOKEN: z.string().min(1).optional(),
  EMAIL_DRIVER: z.enum(["resend", "fake"]).default("resend"),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | undefined;

/**
 * Lazily parses and validates `process.env` on first call, then caches
 * the result for subsequent calls within the same runtime instance.
 *
 * Throws a descriptive error (fail-fast) if a required variable is
 * missing or malformed. Never call this at module scope.
 */
export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

/** Test-only helper to reset the cached env between test cases. */
export function __resetEnvCacheForTests(): void {
  cachedEnv = undefined;
}
