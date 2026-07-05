import { z } from "zod";

/**
 * Build-safe public environment schema.
 *
 * Unlike `env.ts`, this module only validates values that are safe to
 * read at `next build` time (no secrets) and is safe to import at
 * module scope from build-time code paths such as `app/sitemap.ts`,
 * `app/[locale]/rss.xml/route.ts`, or `generateMetadata`.
 *
 * `NEXT_PUBLIC_SITE_URL` defaults to `http://localhost:3000` when unset
 * so that `next build` never fails locally or in CI just because the
 * production domain has not been configured yet.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .default("http://localhost:3000"),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

const parsed = publicEnvSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

/**
 * Validated public env, safe to import and use directly at module scope
 * anywhere, including build-time code.
 */
export const publicEnv: PublicEnv = parsed;
