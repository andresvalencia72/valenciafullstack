import { describe, expect, it } from "vitest";
import { hmacSha256Hex } from "./hmac-sha256";

describe("hmacSha256Hex", () => {
  it("produces the known HMAC-SHA256 hex digest for a given value/secret pair", () => {
    // Verified independently via `node -e "require('crypto').createHmac('sha256','test-secret').update('203.0.113.5').digest('hex')"`
    expect(hmacSha256Hex("203.0.113.5", "test-secret")).toBe(
      "c12f8e7751324dde527c0aadda376f1fe77ea4222b8016bbec5f5da346a1e8be",
    );
  });

  it("produces a different digest for a different secret (triangulation — same value, different key)", () => {
    const withSecretA = hmacSha256Hex("203.0.113.5", "secret-a");
    const withSecretB = hmacSha256Hex("203.0.113.5", "secret-b");

    expect(withSecretA).not.toBe(withSecretB);
    expect(withSecretA).toHaveLength(64);
    expect(withSecretB).toHaveLength(64);
  });
});
