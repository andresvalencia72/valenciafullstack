import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DockerIcon } from "./docker-icon";
import { FigmaIcon } from "./figma-icon";
import { GitIcon } from "./git-icon";
import { SKILL_ICONS, type IconName } from "./index";
import { JavascriptIcon } from "./javascript-icon";
import { NextjsIcon } from "./nextjs-icon";
import { NodejsIcon } from "./nodejs-icon";
import { PhpIcon } from "./php-icon";
import { PostgresqlIcon } from "./postgresql-icon";
import { ReactIcon } from "./react-icon";
import { TypescriptIcon } from "./typescript-icon";

/**
 * Devicon-derived brand icon components (github-activity-panel/skills:
 * replaces skill-badge's monogram placeholder, design-reference parity).
 * Each component is a small, self-contained SVG vendored from the
 * devicon npm package (MIT) — see docs/third-party-assets.md.
 */
const ICON_COMPONENTS: Record<
  IconName,
  (props: { className?: string }) => React.JSX.Element
> = {
  docker: DockerIcon,
  figma: FigmaIcon,
  git: GitIcon,
  javascript: JavascriptIcon,
  nextjs: NextjsIcon,
  nodejs: NodejsIcon,
  php: PhpIcon,
  postgresql: PostgresqlIcon,
  react: ReactIcon,
  typescript: TypescriptIcon,
};

describe("devicon-derived skill icons", () => {
  it.each(Object.entries(ICON_COMPONENTS))(
    "renders %s as a decorative, aria-hidden svg with a stable data-icon hook",
    (name, Icon) => {
      const { container } = render(<Icon />);
      const svg = container.querySelector("svg");

      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("focusable", "false");
      expect(svg).toHaveAttribute("data-icon", name);
      expect(svg).toHaveAttribute("viewBox", "0 0 128 128");
    },
  );

  it("forwards a className to size/position the icon", () => {
    const { container } = render(<ReactIcon className="h-5 w-5" />);
    expect(container.querySelector("svg")).toHaveClass("h-5", "w-5");
  });

  it("exposes every icon through the SKILL_ICONS lookup map, matching the component set exactly", () => {
    expect(Object.keys(SKILL_ICONS).sort()).toEqual(
      Object.keys(ICON_COMPONENTS).sort(),
    );
  });
});
