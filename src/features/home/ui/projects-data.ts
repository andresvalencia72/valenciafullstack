export interface ProjectEntry {
  /** Message-catalog key under `home.projects.items.<id>`. */
  id: "portfolio" | "placeholderTwo" | "placeholderThree";
  index: string;
  year: number;
  stack: string;
  techs: string[];
  demoHref?: string;
  repoHref: string;
  /** Screenshot placeholder caption (design-system: Token Derivation —
   * content only, not translated, matches the "captura · <slug>" style
   * used by design-reference/). */
  screenshotCaption: string;
  isPlaceholder: boolean;
}

/**
 * Project entries for the alternating projects list (home-page: Section
 * Composition — projects). `portfolio` is a real, verifiable entry (this
 * very repository); `placeholderTwo`/`placeholderThree` are explicitly
 * marked placeholders — in copy (see `home.projects.placeholderBadge`
 * and each item's `problem`/`solution` text) and here in code — for the
 * user to replace with real shipped projects. Their demo/repo links
 * point at the user's GitHub profile rather than a fabricated repo, per
 * the "clearly marked for the user to replace" requirement.
 */
export const PROJECTS: ProjectEntry[] = [
  {
    id: "portfolio",
    index: "01",
    year: 2026,
    stack: "Full Stack",
    techs: ["Next.js", "TypeScript", "Tailwind", "PostgreSQL"],
    repoHref: "https://github.com/andresvalencia72/valenciafullstack",
    screenshotCaption: "captura · portfolio",
    isPlaceholder: false,
  },
  {
    id: "placeholderTwo",
    index: "02",
    year: 2026,
    stack: "Full Stack",
    techs: ["React", "TypeScript"],
    repoHref: "https://github.com/andresvalencia72",
    screenshotCaption: "captura · proyecto 2",
    isPlaceholder: true,
  },
  {
    id: "placeholderThree",
    index: "03",
    year: 2026,
    stack: "Full Stack",
    techs: ["Node.js", "PostgreSQL"],
    repoHref: "https://github.com/andresvalencia72",
    screenshotCaption: "captura · proyecto 3",
    isPlaceholder: true,
  },
];
