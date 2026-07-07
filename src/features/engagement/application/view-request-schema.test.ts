import { describe, expect, it } from "vitest";
import { viewRequestSchema } from "./view-request-schema";

describe("viewRequestSchema", () => {
  it("accepts a payload with a non-empty slug (security: Input Validation on Every Endpoint)", () => {
    const result = viewRequestSchema.safeParse({ slug: "clean-architecture-nextjs" });

    expect(result.success).toBe(true);
  });

  it("rejects a payload with an empty slug (triangulation)", () => {
    const result = viewRequestSchema.safeParse({ slug: "" });

    expect(result.success).toBe(false);
  });

  it("rejects a payload missing the slug field (triangulation)", () => {
    const result = viewRequestSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("rejects a payload with a non-string slug (triangulation)", () => {
    const result = viewRequestSchema.safeParse({ slug: 42 });

    expect(result.success).toBe(false);
  });

  it("rejects a null payload (triangulation: malformed body)", () => {
    const result = viewRequestSchema.safeParse(null);

    expect(result.success).toBe(false);
  });
});
