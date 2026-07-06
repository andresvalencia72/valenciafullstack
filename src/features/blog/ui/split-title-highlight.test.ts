import { describe, expect, it } from "vitest";
import { splitTitleHighlight } from "./split-title-highlight";

describe("splitTitleHighlight", () => {
  it("splits the last word out from the rest of the title", () => {
    expect(splitTitleHighlight("Clean Architecture in Next.js")).toEqual({
      leading: "Clean Architecture in",
      highlighted: "Next.js",
    });
  });

  it("treats a single-word title as fully highlighted with no leading text", () => {
    expect(splitTitleHighlight("Patterns")).toEqual({
      leading: "",
      highlighted: "Patterns",
    });
  });

  it("collapses repeated whitespace when splitting", () => {
    expect(splitTitleHighlight("Design   Patterns  Daily")).toEqual({
      leading: "Design Patterns",
      highlighted: "Daily",
    });
  });
});
