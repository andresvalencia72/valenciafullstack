import { describe, expect, it } from "vitest";
import { formatArticleDate } from "./format-article-date";

describe("formatArticleDate", () => {
  it("formats a date in Spanish (day, abbreviated month, year)", () => {
    expect(formatArticleDate("2026-06-14", "es")).toBe("14 jun 2026");
  });

  it("formats a date in English (day, abbreviated month, year)", () => {
    expect(formatArticleDate("2026-06-14", "en")).toBe("Jun 14, 2026");
  });
});
