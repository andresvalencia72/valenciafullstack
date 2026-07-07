/**
 * Maps a locale to its Postgres full-text-search `regconfig` (search:
 * Full-Text Query — "the `tsvector` column and the search query MUST
 * use the locale's PostgreSQL regconfig"). Pure function, zero imports —
 * `domain` MAY NOT import anything, not even a sibling `domain` file in
 * the same feature (eslint-boundaries' `domain: allow: []` rule has no
 * same-feature carve-out, unlike `application`/`infrastructure`/`ui`;
 * see PR6 apply findings). `"es" | "en"` is duplicated verbatim rather
 * than importing `SearchLocale` from `./article-search-repository`, the
 * same rationale as `blog`'s `ArticleLocale` (PR4) and `contact`'s
 * `ContactLocale` (PR6) duplications.
 */
export function regconfigForLocale(locale: "es" | "en"): "spanish" | "english" {
  return locale === "es" ? "spanish" : "english";
}
