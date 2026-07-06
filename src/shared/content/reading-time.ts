const WORDS_PER_MINUTE = 200;

/**
 * Strips the most common Markdown/MDX syntax noise (headings, emphasis
 * markers, links, inline code, fenced code blocks) so reading time is
 * computed from readable prose, not raw markup characters.
 */
function stripMarkdownSyntax(source: string): string {
  return source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_>#-]/g, " ");
}

/**
 * Computes reading time in whole minutes from MDX body content
 * (blog: article page reading time — computed, never hand-written in
 * frontmatter). Always at least 1 minute.
 */
export function computeReadingTimeMinutes(content: string): number {
  const plainText = stripMarkdownSyntax(content).trim();
  const wordCount = plainText.length === 0 ? 0 : plainText.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / WORDS_PER_MINUTE);

  return Math.max(1, minutes);
}
