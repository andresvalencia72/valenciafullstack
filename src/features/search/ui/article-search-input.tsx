"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/shared/i18n/routing";

export interface SearchResultItem {
  slug: string;
  title: string;
  description: string;
  category: string;
  locale: Locale;
  url: string;
}

export type SearchInputStatus = "idle" | "loading" | "ok" | "error" | "unavailable";

export interface SearchInputState {
  query: string;
  status: SearchInputStatus;
  results: SearchResultItem[];
}

interface ArticleSearchInputProps {
  locale: Locale;
  /** Called on every state transition — the `home/` composition root
   * (`ArticlesWithSearch`) is the only consumer (search: Full-Text
   * Query, No-Match Handling, Graceful Degradation When Database
   * Unavailable). */
  onStateChange: (state: SearchInputState) => void;
  /** Incrementing this prop clears this input's own query text and
   * reports an idle state (article-filter: Selecting a pill clears an
   * active search query — the pill click lives in `home`, which owns
   * this prop's value). */
  resetSignal: number;
}

const DEBOUNCE_MS = 300;
const IDLE_STATE: Omit<SearchInputState, "query"> = { status: "idle", results: [] };

/**
 * Debounced, controlled-from-within search input (search: Input
 * Validation and Rate Limiting — client-side 300ms debounce; Graceful
 * Degradation When Database Unavailable). Renders ONLY the `<input>` —
 * results are rendered by `home/ui`'s `ArticlesSection` in the articles
 * list area (home-page: Embedded Article List — "positioned above the
 * category filter pills ... results rendered in place within the
 * articles list"), so this component reports fetched results upward via
 * `onStateChange` instead of rendering them itself.
 */
export function ArticleSearchInput({
  locale,
  onStateChange,
  resetSignal,
}: ArticleSearchInputProps) {
  const t = useTranslations("home.articles.search");
  const [query, setQuery] = useState("");
  // Only meaningful while `query` is non-empty — the "idle" case is
  // derived below rather than stored, so clearing the query never needs
  // a same-effect `setState` call for status (avoids
  // react-hooks/set-state-in-effect: an empty query deterministically
  // implies "idle", it doesn't need its own state slot).
  const [fetchStatus, setFetchStatus] = useState<SearchInputStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const status: SearchInputStatus = query.length === 0 ? "idle" : fetchStatus;

  // Reset: clear this input's own query whenever `resetSignal` changes
  // (skipping the very first render, which is not a reset). Clearing
  // `query` alone is sufficient — `status` derives back to "idle" above.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setQuery("");
    onStateChange({ query: "", ...IDLE_STATE });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset is keyed on resetSignal only
  }, [resetSignal]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length === 0) {
      onStateChange({ query: "", ...IDLE_STATE });
      return;
    }

    debounceRef.current = setTimeout(() => {
      setFetchStatus("loading");
      onStateChange({ query, status: "loading", results: [] });

      fetch(`/api/search?locale=${locale}&q=${encodeURIComponent(query)}`)
        .then(async (response) => {
          if (response.status === 503) {
            setFetchStatus("unavailable");
            onStateChange({ query, status: "unavailable", results: [] });
            return;
          }
          if (!response.ok) {
            setFetchStatus("error");
            onStateChange({ query, status: "error", results: [] });
            return;
          }
          const data = (await response.json()) as { results: SearchResultItem[] };
          setFetchStatus("ok");
          onStateChange({ query, status: "ok", results: data.results });
        })
        .catch(() => {
          setFetchStatus("error");
          onStateChange({ query, status: "error", results: [] });
        });
    }, DEBOUNCE_MS);

    // No `if (debounceRef.current)` guard here (unlike the two guards
    // above) — this cleanup only ever exists after the `setTimeout` call
    // immediately above just assigned `debounceRef.current`, so it is
    // always truthy at this point; an extra guard would be unreachable
    // defensive code (same category as PR5b's `ArticleViewRepository
    // .countViews` finding and PR7's `isReady` derivation).
    return () => clearTimeout(debounceRef.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onStateChange identity is not a dependency
  }, [query, locale]);

  return (
    <input
      type="search"
      role="searchbox"
      value={query}
      disabled={status === "unavailable"}
      onChange={(event) => setQuery(event.target.value)}
      placeholder={t("placeholder")}
      aria-label={t("placeholder")}
      className="w-full rounded-full border border-line bg-card px-4.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-coral focus:outline-none disabled:opacity-50"
    />
  );
}
