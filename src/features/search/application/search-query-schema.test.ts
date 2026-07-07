import { describe, expect, it } from "vitest";
import { searchQuerySchema } from "./search-query-schema";

describe("searchQuerySchema", () => {
  it("accepts a valid query + locale (search: Full-Text Query)", () => {
    const result = searchQuerySchema.safeParse({ q: "hexagonal", locale: "es" });

    expect(result.success).toBe(true);
  });

  it("rejects an empty query", () => {
    const result = searchQuerySchema.safeParse({ q: "", locale: "es" });

    expect(result.success).toBe(false);
  });

  it("rejects a query longer than 200 characters (search: Oversized query rejected)", () => {
    const result = searchQuerySchema.safeParse({ q: "a".repeat(201), locale: "es" });

    expect(result.success).toBe(false);
  });

  it("accepts a query at exactly 200 characters (boundary)", () => {
    const result = searchQuerySchema.safeParse({ q: "a".repeat(200), locale: "es" });

    expect(result.success).toBe(true);
  });

  it("rejects a locale outside es/en (search: Invalid locale rejected)", () => {
    const result = searchQuerySchema.safeParse({ q: "hexagonal", locale: "fr" });

    expect(result.success).toBe(false);
  });

  it("rejects a missing locale", () => {
    const result = searchQuerySchema.safeParse({ q: "hexagonal" });

    expect(result.success).toBe(false);
  });
});
