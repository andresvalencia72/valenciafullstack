export interface TitleHighlightSplit {
  leading: string;
  highlighted: string;
}

/**
 * Splits an article title into a leading run and its final word, so the
 * final word can be visually highlighted (design-reference: article
 * title with a highlight mark on the last word).
 */
export function splitTitleHighlight(title: string): TitleHighlightSplit {
  const words = title.trim().split(/\s+/);
  const highlighted = words.at(-1) ?? "";
  const leading = words.slice(0, -1).join(" ");

  return { leading, highlighted };
}
