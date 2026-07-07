import { describe, expect, it } from "vitest";
import { stripMarkdownToText } from "./strip-markdown-to-text";

describe("stripMarkdownToText", () => {
  it("removes heading markers but keeps the text (search: Index Sync Full Reconcile)", () => {
    expect(stripMarkdownToText("## The four layers")).toBe("The four layers");
  });

  it("removes bold/italic emphasis markers but keeps the text", () => {
    expect(stripMarkdownToText("This is **bold** and this is *italic*.")).toBe(
      "This is bold and this is italic.",
    );
  });

  it("keeps link text and drops the URL", () => {
    expect(
      stripMarkdownToText("Read the [full article](https://example.com/post)."),
    ).toBe("Read the full article.");
  });

  it("drops images entirely (alt text duplicates filenames, not searchable prose)", () => {
    expect(stripMarkdownToText("Before ![diagram](./diagram.png) after")).toBe(
      "Before after",
    );
  });

  it("keeps code fence contents as plain searchable text, dropping the fence markers", () => {
    expect(
      stripMarkdownToText(
        "Example:\n\n```ts\nfindArticle(slug: string): Promise<Article | null>;\n```\n",
      ),
    ).toContain("findArticle(slug: string): Promise<Article | null>;");
    expect(stripMarkdownToText("```ts\nconst x = 1;\n```")).not.toContain("```");
  });

  it("removes inline code backticks but keeps the content", () => {
    expect(stripMarkdownToText("Call `getSlugs()` first.")).toBe(
      "Call getSlugs() first.",
    );
  });

  it("removes JSX/HTML tags entirely, keeping surrounding text", () => {
    expect(stripMarkdownToText('Watch it: <YoutubeEmbed videoId="abc" /> done.')).toBe(
      "Watch it: done.",
    );
  });

  it("removes list markers but keeps the item text", () => {
    expect(
      stripMarkdownToText("- domain: pure types\n- application: use cases"),
    ).toBe("domain: pure types application: use cases");
  });

  it("removes blockquote markers but keeps the text", () => {
    expect(stripMarkdownToText("> Important note")).toBe("Important note");
  });

  it("collapses repeated whitespace/newlines into single spaces and trims", () => {
    expect(stripMarkdownToText("Line one.\n\n\nLine two.   ")).toBe(
      "Line one. Line two.",
    );
  });
});
