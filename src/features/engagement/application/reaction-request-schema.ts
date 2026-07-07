import { z } from "zod";

/**
 * `POST /api/engagement/reactions` request body (engagement: Reactions
 * with Permanent Dedupe — fixed 3-value enum, no other reaction type
 * accepted; security: Input Validation on Every Endpoint; pinned
 * contract per tasks.md — `{slug, kind}`).
 */
export const reactionRequestSchema = z.object({
  slug: z.string().min(1),
  kind: z.enum(["thumbs_up", "heart", "fire"]),
});

export type ReactionRequest = z.infer<typeof reactionRequestSchema>;
