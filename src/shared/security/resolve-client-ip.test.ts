import { describe, expect, it } from "vitest";
import { resolveClientIp } from "./resolve-client-ip";

describe("resolveClientIp", () => {
  it("trusts the platform-sanitized x-forwarded-for header's first entry when present (security: Rate Limiting on Write/Query Endpoints)", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.5, 70.41.3.18" });

    expect(resolveClientIp(headers)).toBe("203.0.113.5");
  });

  it("falls back to the local/unknown constant when the header is absent (triangulation — local dev, CI e2e against next start)", () => {
    const headers = new Headers();

    expect(resolveClientIp(headers)).toBe("127.0.0.1");
  });

  it("falls back to the local/unknown constant when the header's first entry is blank (triangulation — malformed header)", () => {
    const headers = new Headers({ "x-forwarded-for": "   , 70.41.3.18" });

    expect(resolveClientIp(headers)).toBe("127.0.0.1");
  });
});
