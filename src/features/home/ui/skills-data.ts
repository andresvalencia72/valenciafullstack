import type { IconName } from "./icons";

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
  icon: IconName;
  size: "default" | "wide";
}

/**
 * Skill bento entries, derived from design-reference/'s "habilidades"
 * grid (design-system: Token Derivation — content only, no ad hoc
 * colors). The "main stack" card (React/TypeScript/Node.js) renders
 * separately in `SkillsSection` since its shape (three stacked titles)
 * differs from the single-title cards below. Proper nouns (titles) are
 * not translated — only category labels and descriptions come from the
 * `home.skills` message catalog. `icon` indexes into
 * `icons/`'s `SKILL_ICONS` map (devicon-derived brand marks, see
 * docs/third-party-assets.md) and matches design-reference/'s
 * `devicon-{name}-*` classes 1:1.
 */
export const SKILLS: SkillEntry[] = [
  { category: "language", title: "JavaScript", icon: "javascript", size: "default" },
  { category: "backend", title: "PHP", icon: "php", size: "default" },
  { category: "data", title: "SQL", icon: "postgresql", size: "default" },
  { category: "workflow", title: "Git", icon: "git", size: "default" },
  {
    category: "learning",
    title: "Next.js · App Router",
    icon: "nextjs",
    size: "wide",
  },
  { category: "infra", title: "Docker", icon: "docker", size: "default" },
  { category: "design", title: "Figma", icon: "figma", size: "default" },
];
