/**
 * Strips MDX/markdown markup down to plain, searchable text
 * (search: Index Sync Full Reconcile — `body_text`). Pure function, no
 * imports — code fence/inline-code CONTENT is kept (a code sample is
 * still meaningful full-text search material, e.g. a visitor searching
 * a method name used only inside a snippet), while fence/backtick
 * markers, JSX/HTML tags, link/image syntax, heading/emphasis/list/
 * blockquote markers are all removed.
 */
/** Placeholder marker swapped in for fenced code blocks while the rest of
 * the markdown is stripped, so a generic type like `Promise<Article |
 * null>` inside a code sample is never mistaken for a JSX/HTML tag by
 * the tag-stripping step below. Reinserted (with only its own backticks
 * removed) at the very end. */
function codeBlockPlaceholder(index: number): string {
  return `CODEBLOCKPLACEHOLDER${index}ENDPLACEHOLDER`;
}

export function stripMarkdownToText(markdown: string): string {
  const codeBlocks: string[] = [];
  const withPlaceholders = markdown.replace(
    /```[a-zA-Z0-9]*\n?([\s\S]*?)```/g,
    (_match, code: string) => {
      codeBlocks.push(code.trim());
      return codeBlockPlaceholder(codeBlocks.length - 1);
    },
  );

  const stripped = withPlaceholders
    // Inline code: drop backticks, keep the content.
    .replace(/`([^`]*)`/g, "$1")
    // Images: drop entirely — alt text usually duplicates a filename,
    // not searchable prose.
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    // Links: keep the link text, drop the URL.
    .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
    // JSX/HTML tags (self-closing or not): drop the tag, keep sibling text.
    .replace(/<\/?[a-zA-Z][^>]*>/g, "")
    // Headings.
    .replace(/^#{1,6}\s+/gm, "")
    // Bold/italic emphasis markers (** __ * _), longest first so **x**
    // isn't left with dangling single markers.
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    // Blockquote markers.
    .replace(/^>\s?/gm, "")
    // List markers (unordered and ordered).
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    // Collapse whitespace/newlines and trim.
    .replace(/\s+/g, " ")
    .trim();

  return stripped.replace(
    /CODEBLOCKPLACEHOLDER(\d+)ENDPLACEHOLDER/g,
    (_match, indexText: string) =>
      codeBlocks[Number(indexText)].replace(/\s+/g, " ").trim(),
  );
}
