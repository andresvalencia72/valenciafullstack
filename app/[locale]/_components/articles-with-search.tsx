"use client";

import { useState } from "react";
import { ArticlesSection } from "@/features/home/ui/articles-section";
import type { HomeArticleSummary } from "@/features/home/domain/article-summary";
import type { HomeSearchResultSummary } from "@/features/home/domain/search-result-summary";
import {
  ArticleSearchInput,
  type SearchInputState,
} from "@/features/search/ui/article-search-input";
import type { Locale } from "@/shared/i18n/routing";

interface ArticlesWithSearchProps {
  articles: HomeArticleSummary[];
  locale: Locale;
}

const IDLE_SEARCH_STATE: SearchInputState = { query: "", status: "idle", results: [] };

/**
 * Composition-root wiring between `home/ui`'s `ArticlesSection` and
 * `search/ui`'s `ArticleSearchInput` (home-page: Embedded Article List —
 * search input). Lives under `app/` (not a route itself — an
 * underscore-prefixed folder, excluded from routing) specifically so
 * this two-feature coordination stays out of both features' `ui`
 * folders: cross-feature `ui -> ui` imports are eslint-boundaries-
 * disallowed, AND `page.tsx` (a Server Component) cannot pass functions
 * as props across the RSC boundary into a Client Component — so the
 * state/callbacks bridging the two widgets must live in a Client
 * Component that imports both directly. This extends PR6's
 * ContactSection/ContactForm and PR7's ArticlePage/EngagementPanel
 * children-composition pattern to a case that additionally needs
 * bidirectional coordination with the category filter (typing
 * deactivates the pill; selecting a pill resets the search).
 */
export function ArticlesWithSearch({ articles, locale }: ArticlesWithSearchProps) {
  const [searchState, setSearchState] = useState<SearchInputState>(IDLE_SEARCH_STATE);
  const [resetSignal, setResetSignal] = useState(0);

  const searchResults: HomeSearchResultSummary[] = searchState.results.map((result) => ({
    slug: result.slug,
    title: result.title,
    description: result.description,
    category: result.category,
    locale: result.locale,
  }));

  return (
    <ArticlesSection
      articles={articles}
      searchActive={searchState.query.length > 0}
      searchStatus={searchState.status}
      searchResults={searchResults}
      onSearchReset={() => setResetSignal((n) => n + 1)}
      searchInputSlot={
        <ArticleSearchInput
          locale={locale}
          onStateChange={setSearchState}
          resetSignal={resetSignal}
        />
      }
    />
  );
}
