/**
 * Raised whenever the content pipeline detects invalid article content
 * (bad frontmatter, reserved slug, unknown category, or divergent
 * locale siblings). Thrown during `generateStaticParams`/module load so
 * `next build` fails with a clear message (blog: Frontmatter Validation,
 * Cross-Locale Frontmatter Consistency).
 */
export class ContentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentValidationError";
  }
}
