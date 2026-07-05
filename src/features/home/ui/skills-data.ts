export type SkillCategory =
  | "language"
  | "backend"
  | "data"
  | "workflow"
  | "learning"
  | "infra"
  | "design";

export interface SkillEntry {
  category: SkillCategory;
  title: string;
  badge: string;
  size: "default" | "wide";
}

/**
 * Skill bento entries, derived from design-reference/'s "habilidades"
 * grid (design-system: Token Derivation — content only, no ad hoc
 * colors). The "main stack" card (React/TypeScript/Node.js) renders
 * separately in `SkillsSection` since its shape (three stacked titles)
 * differs from the single-title cards below. Proper nouns (titles,
 * badges) are not translated — only category labels and descriptions
 * come from the `home.skills` message catalog.
 */
export const SKILLS: SkillEntry[] = [
  { category: "language", title: "JavaScript", badge: "JS", size: "default" },
  // Badges intentionally differ from the title text (e.g. "Ph" not "PHP")
  // to keep each card's title and badge as distinct accessible strings.
  { category: "backend", title: "PHP", badge: "Ph", size: "default" },
  { category: "data", title: "SQL", badge: "Db", size: "default" },
  { category: "workflow", title: "Git", badge: "Gt", size: "default" },
  {
    category: "learning",
    title: "Next.js · App Router",
    badge: "N",
    size: "wide",
  },
  { category: "infra", title: "Docker", badge: "Do", size: "default" },
  { category: "design", title: "Figma", badge: "Fi", size: "default" },
];
