"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactionCounts, ReactionKind } from "../domain/article-reaction-repository";

const REACTION_KINDS: readonly ReactionKind[] = ["thumbs_up", "heart", "fire"];

interface EngagementSummaryResponse {
  views: number;
  reactions: ReactionCounts;
}

export type EngagementStatus = "loading" | "ready" | "degraded";

export interface UseEngagementResult {
  status: EngagementStatus;
  views: number | null;
  reactions: ReactionCounts | null;
  hasReacted: (kind: ReactionKind) => boolean;
  react: (kind: ReactionKind) => void;
}

function reactedStorageKey(slug: string, kind: ReactionKind): string {
  return `engagement:reacted:${slug}:${kind}`;
}

function readReactedFlag(slug: string, kind: ReactionKind): boolean {
  try {
    return window.localStorage.getItem(reactedStorageKey(slug, kind)) === "1";
  } catch {
    // localStorage unavailable (e.g. privacy mode) — treated as "not yet
    // reacted", the same SSR-safe default as a fresh visitor.
    return false;
  }
}

function writeReactedFlag(slug: string, kind: ReactionKind): void {
  try {
    window.localStorage.setItem(reactedStorageKey(slug, kind), "1");
  } catch {
    // Optimistic UI state still works for the current page load; it
    // just won't persist across reloads (same tradeoff as useTheme's
    // localStorage write).
  }
}

/**
 * Client hook driving the article engagement widget (engagement: View
 * Counting with Permanent Dedupe — view-once-per-load, Graceful
 * Degradation When Database Unavailable). Fires exactly one view POST
 * per hydration and exposes an optimistic, localStorage-backed reaction
 * affordance (tasks.md Implementation Notes residual: "after a reaction
 * POST (always 204), apply optimistic increment client-side and persist
 * a local 'reacted' flag in localStorage").
 */
export function useEngagement(slug: string): UseEngagementResult {
  const [status, setStatus] = useState<EngagementStatus>("loading");
  const [views, setViews] = useState<number | null>(null);
  const [reactions, setReactions] = useState<ReactionCounts | null>(null);
  // Starts empty and hydrates from localStorage inside the effect below:
  // reading the flag in the useState initializer would render
  // `aria-pressed` differently on the server (no localStorage, always
  // false) than on the client's hydration render, causing a React
  // hydration mismatch. The SSR-safe default is "not yet reacted".
  const [reactedKinds, setReactedKinds] = useState<ReadonlySet<ReactionKind>>(
    () => new Set(),
  );
  const viewFired = useRef(false);

  useEffect(() => {
    let cancelled = false;

    // Intentional one-time sync from an external system (localStorage)
    // into React state — the same carve-out `useTheme` documents for
    // this rule. See the comment on `reactedKinds` above: reading the
    // flag any earlier reproduces the PR2 `aria-pressed` hydration
    // mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReactedKinds(new Set(REACTION_KINDS.filter((kind) => readReactedFlag(slug, kind))));

    async function loadSummary() {
      try {
        const response = await fetch(`/api/engagement/${slug}`);
        if (!response.ok) {
          throw new Error("engagement summary unavailable");
        }
        const data = (await response.json()) as EngagementSummaryResponse;
        if (cancelled) {
          return;
        }
        setViews(data.views);
        setReactions(data.reactions);
        setStatus("ready");
      } catch {
        if (!cancelled) {
          setStatus("degraded");
        }
      }
    }

    void loadSummary();

    // Guarded by a ref (not just the effect's own single run) so a
    // future refactor that re-triggers this effect (e.g. a broader
    // dependency array) can't silently fire a second view POST for the
    // same page load (engagement: "MUST NOT fire additional view
    // requests for the same page load").
    if (!viewFired.current) {
      viewFired.current = true;
      fetch("/api/engagement/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      }).catch(() => {
        // Fire-and-forget — a failed view POST must not block or
        // degrade the counts display.
      });
    }

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const react = useCallback(
    (kind: ReactionKind) => {
      if (readReactedFlag(slug, kind)) {
        return;
      }

      writeReactedFlag(slug, kind);
      setReactedKinds((current) => new Set(current).add(kind));
      setReactions((current) =>
        current ? { ...current, [kind]: current[kind] + 1 } : current,
      );

      fetch("/api/engagement/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, kind }),
      }).catch(() => {
        // Optimistic UI intentionally stays as-is on network failure —
        // the permanent server-side dedupe (or a retry on next visit)
        // is the source of truth; rolling back would just flicker the
        // count for what's usually a transient failure.
      });
    },
    [slug],
  );

  const hasReacted = useCallback(
    (kind: ReactionKind) => reactedKinds.has(kind),
    [reactedKinds],
  );

  return { status, views, reactions, hasReacted, react };
}
