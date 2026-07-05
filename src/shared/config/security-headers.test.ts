import { describe, expect, it } from "vitest";
import { securityHeaders } from "./security-headers";

function findHeader(name: string): string | undefined {
  return securityHeaders.find(
    (header) => header.key.toLowerCase() === name.toLowerCase(),
  )?.value;
}

describe("securityHeaders", () => {
  it("sets X-Content-Type-Options to nosniff", () => {
    expect(findHeader("X-Content-Type-Options")).toBe("nosniff");
  });

  it("sets X-Frame-Options to DENY", () => {
    expect(findHeader("X-Frame-Options")).toBe("DENY");
  });

  it("sets a restrictive Referrer-Policy", () => {
    expect(findHeader("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("sets Strict-Transport-Security with a long max-age, includeSubDomains and preload", () => {
    const hsts = findHeader("Strict-Transport-Security");
    expect(hsts).toBeDefined();
    expect(hsts).toMatch(/max-age=\d+/);
    const maxAge = Number(hsts?.match(/max-age=(\d+)/)?.[1]);
    // At least 6 months, per common HSTS preload guidance.
    expect(maxAge).toBeGreaterThanOrEqual(15552000);
    expect(hsts).toContain("includeSubDomains");
    expect(hsts).toContain("preload");
  });

  describe("Content-Security-Policy (ADR-0007)", () => {
    const csp = findHeader("Content-Security-Policy");

    it("is present", () => {
      expect(csp).toBeDefined();
    });

    it("sets script-src to 'self' 'unsafe-inline'", () => {
      expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    });

    it("sets style-src to 'self' 'unsafe-inline'", () => {
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    });

    it("sets object-src to 'none'", () => {
      expect(csp).toContain("object-src 'none'");
    });

    it("sets frame-ancestors to 'none'", () => {
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it("sets base-uri to 'self'", () => {
      expect(csp).toContain("base-uri 'self'");
    });
  });
});
