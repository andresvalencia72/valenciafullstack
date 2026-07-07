import { describe, expect, it } from "vitest";
import { buildSecurityHeaders, securityHeaders } from "./security-headers";

function findHeader(
  headers: { key: string; value: string }[],
  name: string,
): string | undefined {
  return headers.find(
    (header) => header.key.toLowerCase() === name.toLowerCase(),
  )?.value;
}

describe("securityHeaders", () => {
  it("sets X-Content-Type-Options to nosniff", () => {
    expect(findHeader(securityHeaders, "X-Content-Type-Options")).toBe(
      "nosniff",
    );
  });

  it("sets X-Frame-Options to DENY", () => {
    expect(findHeader(securityHeaders, "X-Frame-Options")).toBe("DENY");
  });

  it("sets a restrictive Referrer-Policy", () => {
    expect(findHeader(securityHeaders, "Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
  });

  it("sets Strict-Transport-Security with a long max-age, includeSubDomains and preload", () => {
    const hsts = findHeader(securityHeaders, "Strict-Transport-Security");
    expect(hsts).toBeDefined();
    expect(hsts).toMatch(/max-age=\d+/);
    const maxAge = Number(hsts?.match(/max-age=(\d+)/)?.[1]);
    // At least 6 months, per common HSTS preload guidance.
    expect(maxAge).toBeGreaterThanOrEqual(15552000);
    expect(hsts).toContain("includeSubDomains");
    expect(hsts).toContain("preload");
  });

  describe("Content-Security-Policy (ADR-0007)", () => {
    const csp = findHeader(securityHeaders, "Content-Security-Policy");

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

describe("buildSecurityHeaders (dev-only 'unsafe-eval' exception)", () => {
  const PRODUCTION_CSP =
    "default-src 'self'; script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; " +
    "font-src 'self' data:; connect-src 'self'; object-src 'none'; " +
    "frame-ancestors 'none'; base-uri 'self'";

  it("does NOT contain 'unsafe-eval' in production (isDev: false)", () => {
    const csp = findHeader(
      buildSecurityHeaders(false),
      "Content-Security-Policy",
    );
    expect(csp).toBe(PRODUCTION_CSP);
    expect(csp).not.toContain("unsafe-eval");
  });

  it("keeps the default (no-arg) build identical to production", () => {
    // Any accidental default flip to `true` would break this — the
    // canonical, byte-identical production CSP must ship by default.
    const csp = findHeader(
      buildSecurityHeaders(),
      "Content-Security-Policy",
    );
    expect(csp).toBe(PRODUCTION_CSP);
  });

  it("adds 'unsafe-eval' to script-src in development (isDev: true)", () => {
    const csp = findHeader(
      buildSecurityHeaders(true),
      "Content-Security-Policy",
    );
    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
  });

  it("keeps the development CSP identical to production apart from script-src", () => {
    const prodCsp = findHeader(
      buildSecurityHeaders(false),
      "Content-Security-Policy",
    );
    const devCsp = findHeader(
      buildSecurityHeaders(true),
      "Content-Security-Policy",
    );
    expect(devCsp).toBe(prodCsp?.replace(
      "script-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    ));
  });

  it("only changes Content-Security-Policy between dev and production, all other headers stay identical", () => {
    const prodHeaders = buildSecurityHeaders(false);
    const devHeaders = buildSecurityHeaders(true);
    for (const header of prodHeaders) {
      if (header.key === "Content-Security-Policy") continue;
      expect(findHeader(devHeaders, header.key)).toBe(header.value);
    }
  });
});
