import { z } from "zod";

/**
 * `POST /api/engagement/views` request body (security: Input Validation
 * on Every Endpoint; pinned contract per tasks.md — `{slug}`).
 */
export const viewRequestSchema = z.object({
  slug: z.string().min(1),
});

export type ViewRequest = z.infer<typeof viewRequestSchema>;
