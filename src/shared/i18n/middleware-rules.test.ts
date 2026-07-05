import { describe, expect, it } from "vitest";
import {
  isExcludedFromLocaleRouting,
  upgradeRedirectStatus,
} from "./middleware-rules";

describe("isExcludedFromLocaleRouting", () => {
  it.each([
    ["/api/contact", true],
    ["/api/engagement/views", true],
    ["/sitemap.xml", true],
    ["/robots.txt", true],
    ["/_next/static/chunk.js", true],
    ["/favicon.ico", true],
    ["/logo.png", true],
    ["/fonts/clash-display.woff2", true],
  ])("excludes %s from locale routing", (pathname, expected) => {
    expect(isExcludedFromLocaleRouting(pathname)).toBe(expected);
  });

  it.each([
    ["/", false],
    ["/es", false],
    ["/en/blog/my-post", false],
    ["/blog/my-post", false],
    // /rss.xml is explicitly NOT excluded — it must still 308-redirect
    // to /es/rss.xml through the normal locale routing rule (i18n:
    // Locale Routing — Unprefixed RSS feed redirects).
    ["/rss.xml", false],
  ])("does not exclude %s from locale routing", (pathname, expected) => {
    expect(isExcludedFromLocaleRouting(pathname)).toBe(expected);
  });
});

describe("upgradeRedirectStatus", () => {
  it("upgrades a 307 redirect status to 308 (permanent)", () => {
    expect(upgradeRedirectStatus(307)).toBe(308);
  });

  it("leaves a non-redirect status untouched", () => {
    expect(upgradeRedirectStatus(200)).toBe(200);
  });

  it("leaves an already-permanent redirect untouched", () => {
    expect(upgradeRedirectStatus(308)).toBe(308);
  });
});
