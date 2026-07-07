import { z } from "zod";

/**
 * Search query validation (search: Input Validation and Rate Limiting).
 * `q` MUST be non-empty and at most 200 characters; `locale` MUST be
 * `es`/`en`. Placed in `application` (not `domain`), matching the
 * established precedent for request-shape Zod schemas in this codebase
 * (contact's `contact-submission-schema.ts`, engagement's
 * `view-request-schema.ts`/`reaction-request-schema.ts`).
 */
export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  locale: z.enum(["es", "en"]),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
