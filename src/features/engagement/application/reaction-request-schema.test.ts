import { describe, expect, it } from "vitest";
import { reactionRequestSchema } from "./reaction-request-schema";

describe("reactionRequestSchema", () => {
  it.each(["thumbs_up", "heart", "fire"] as const)(
    "accepts a payload with slug and reaction kind %s (engagement: Reactions with Permanent Dedupe)",
    (kind) => {
      const result = reactionRequestSchema.safeParse({
        slug: "clean-architecture-nextjs",
        kind,
      });

      expect(result.success).toBe(true);
    },
  );

  it("rejects a reaction kind outside the fixed enum (engagement: Invalid reaction type)", () => {
    const result = reactionRequestSchema.safeParse({
      slug: "clean-architecture-nextjs",
      kind: "like",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a payload missing the kind field (triangulation)", () => {
    const result = reactionRequestSchema.safeParse({
      slug: "clean-architecture-nextjs",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a payload with an empty slug (triangulation)", () => {
    const result = reactionRequestSchema.safeParse({ slug: "", kind: "heart" });

    expect(result.success).toBe(false);
  });

  it("rejects a null payload (triangulation: malformed body)", () => {
    const result = reactionRequestSchema.safeParse(null);

    expect(result.success).toBe(false);
  });
});
