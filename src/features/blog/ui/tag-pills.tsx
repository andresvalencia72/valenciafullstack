interface TagPillsProps {
  tags: string[];
}

/**
 * Renders article tags as border pills prefixed with "#" (design-
 * reference: article page tag pills). Tags are stable identifiers, not
 * translated (blog: Frontmatter Validation).
 */
export function TagPills({ tags }: TagPillsProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-ink-soft"
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}
