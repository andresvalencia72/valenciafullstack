/**
 * Storage-agnostic "is this slug a published article?" check (domain:
 * repository-style interface, per persistence: Domain Repository
 * Interfaces). Zero imports — enforced structurally by
 * eslint-plugin-boundaries' `domain: allow: []` rule (see
 * eslint.config.mjs), same as `ArticleViewRepository`/
 * `ArticleReactionRepository` (PR5b).
 *
 * Deliberately abstracted behind this small port rather than depending
 * on `shared/content`'s `MdxLoader` directly from the `application`
 * layer: `shared/content` is a structurally legal import for
 * `application` (see PR6's `RateLimitRepository` precedent — any layer
 * may import `shared/*`), but injecting the full `MdxLoader` (multiple
 * unrelated capabilities, filesystem side effects) would widen the
 * use-case's dependency surface beyond what it actually needs
 * (interface segregation). `infrastructure/mdx-article-slug-checker.ts`
 * is the concrete implementation, backed by the same MDX-derived slug
 * set the PR4 article route uses for `generateStaticParams` — the
 * "published article set" the engagement spec refers to.
 */
export interface ArticleSlugChecker {
  isPublishedSlug(slug: string): Promise<boolean>;
}
