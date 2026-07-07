import { describe, expect, it } from "vitest";
import { deriveVisitorHash } from "./derive-visitor-hash";

describe("deriveVisitorHash", () => {
  it("returns a deterministic hex digest for the same (ip, userAgent, secret) triple (engagement: Privacy-Respecting Visitor Identity)", () => {
    const first = deriveVisitorHash("203.0.113.5", "Mozilla/5.0", "secret");
    const second = deriveVisitorHash("203.0.113.5", "Mozilla/5.0", "secret");

    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces a different digest for a different IP, all else equal (triangulation)", () => {
    const a = deriveVisitorHash("203.0.113.5", "Mozilla/5.0", "secret");
    const b = deriveVisitorHash("203.0.113.6", "Mozilla/5.0", "secret");

    expect(a).not.toBe(b);
  });

  it("produces a different digest for a different user agent, all else equal (triangulation)", () => {
    const a = deriveVisitorHash("203.0.113.5", "Mozilla/5.0", "secret");
    const b = deriveVisitorHash("203.0.113.5", "Chrome/1.0", "secret");

    expect(a).not.toBe(b);
  });

  it("does not collide when ip+userAgent concatenate to the same string across a different split (triangulation: unambiguous signal separation)", () => {
    // Without a delimiter, ("ab", "c") and ("a", "bc") would hash identically.
    const a = deriveVisitorHash("ab", "c", "secret");
    const b = deriveVisitorHash("a", "bc", "secret");

    expect(a).not.toBe(b);
  });
});
