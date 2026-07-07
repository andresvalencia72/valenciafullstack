"use client";

import { useTranslations } from "next-intl";
import type { ReactionKind } from "../domain/article-reaction-repository";
import { ReactionButton } from "./reaction-button";
import { useEngagement } from "./use-engagement";

const REACTION_KINDS: readonly ReactionKind[] = ["thumbs_up", "heart", "fire"];
const REACTION_EMOJI: Record<ReactionKind, string> = {
  thumbs_up: "👍",
  heart: "❤️",
  fire: "🔥",
};

interface EngagementPanelProps {
  slug: string;
}

/**
 * Article engagement widget (engagement: View Counting with Permanent
 * Dedupe, Reactions with Permanent Dedupe, Graceful Degradation When
 * Database Unavailable) — mounted by the `app/[locale]/blog/[slug]/`
 * composition root (task 7.5: "engagement mounts in the PR4 article
 * page"). Counts render only once the summary read succeeds; on a
 * failed read, both the view count text and every reaction's numeric
 * badge are hidden (the reaction buttons themselves stay interactive —
 * a reaction POST fails silently server-side the same way a view POST
 * does, per `useEngagement`'s fire-and-forget error handling).
 */
export function EngagementPanel({ slug }: EngagementPanelProps) {
  const t = useTranslations("engagement");
  const { status, views, reactions, hasReacted, react } = useEngagement(slug);

  // `useEngagement` sets `status`, `views`, and `reactions` together in
  // the same state-update batch (see its `loadSummary` implementation) —
  // whenever `status === "ready"`, `views`/`reactions` are always
  // non-null. This aliased-condition check lets TypeScript narrow both
  // below without a `?? 0` defensive fallback, which would otherwise be
  // dead code no test could legitimately reach (same category as
  // PR5b's `ArticleViewRepository.countViews` finding — an untested
  // fallback branch that coverage correctly flagged as unreachable).
  const isReady = status === "ready" && views !== null && reactions !== null;

  return (
    <section aria-label={t("heading")} className="flex flex-wrap items-center gap-6">
      <p className="font-mono text-xs tracking-wide text-ink-faint uppercase">
        {isReady ? t("viewsLabel", { count: views }) : t("unavailable")}
      </p>

      <div className="flex items-center gap-2">
        {REACTION_KINDS.map((kind) => (
          <ReactionButton
            key={kind}
            kind={kind}
            emoji={REACTION_EMOJI[kind]}
            label={t(`reactions.${kind}`)}
            count={isReady ? reactions[kind] : null}
            active={hasReacted(kind)}
            onReact={react}
          />
        ))}
      </div>
    </section>
  );
}
