import type { ReactionKind } from "../domain/article-reaction-repository";

interface ReactionButtonProps {
  kind: ReactionKind;
  emoji: string;
  label: string;
  /** `null` hides the numeric badge — DB-degraded state (engagement: Graceful Degradation When Database Unavailable). */
  count: number | null;
  active: boolean;
  onReact: (kind: ReactionKind) => void;
}

/**
 * Single reaction affordance (engagement: Reactions with Permanent
 * Dedupe). Purely presentational — optimistic increment, the reacted
 * flag, and the network call all live in `useEngagement`.
 */
export function ReactionButton({
  kind,
  emoji,
  label,
  count,
  active,
  onReact,
}: ReactionButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={() => onReact(kind)}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        active
          ? "border-coral bg-coral/15 text-coral-ink"
          : "border-line text-ink-soft hover:border-coral/60"
      }`}
    >
      <span aria-hidden="true">{emoji}</span>
      {count !== null && (
        <span data-testid={`reaction-count-${kind}`} className="font-mono text-xs">
          {count}
        </span>
      )}
    </button>
  );
}
