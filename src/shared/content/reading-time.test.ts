import { describe, expect, it } from "vitest";
import { computeReadingTimeMinutes } from "./reading-time";

describe("computeReadingTimeMinutes", () => {
  it("rounds up to at least 1 minute for very short content", () => {
    expect(computeReadingTimeMinutes("just a few words here")).toBe(1);
  });

  it("computes minutes at 200 words per minute, rounded up", () => {
    const text = Array.from({ length: 401 }, () => "word").join(" ");

    // 401 words / 200 wpm = 2.005 -> rounds up to 3
    expect(computeReadingTimeMinutes(text)).toBe(3);
  });

  it("computes an exact whole-minute count without rounding up unnecessarily", () => {
    const text = Array.from({ length: 400 }, () => "word").join(" ");

    expect(computeReadingTimeMinutes(text)).toBe(2);
  });

  it("strips markdown/MDX syntax before counting words", () => {
    const text = "# Heading\n\nSome **bold** text with a [link](https://example.com) and `code`.";

    // Word count should reflect readable words, not markdown punctuation.
    expect(computeReadingTimeMinutes(text)).toBe(1);
  });

  it("returns 1 for empty content", () => {
    expect(computeReadingTimeMinutes("")).toBe(1);
  });
});
