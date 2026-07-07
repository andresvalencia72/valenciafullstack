import type { ComponentType } from "react";
import { DockerIcon } from "./docker-icon";
import { FigmaIcon } from "./figma-icon";
import { GitIcon } from "./git-icon";
import type { IconProps } from "./icon-props";
import { JavascriptIcon } from "./javascript-icon";
import { NextjsIcon } from "./nextjs-icon";
import { NodejsIcon } from "./nodejs-icon";
import { PhpIcon } from "./php-icon";
import { PostgresqlIcon } from "./postgresql-icon";
import { ReactIcon } from "./react-icon";
import { TypescriptIcon } from "./typescript-icon";

export type { IconProps } from "./icon-props";

export type IconName =
  | "docker"
  | "figma"
  | "git"
  | "javascript"
  | "nextjs"
  | "nodejs"
  | "php"
  | "postgresql"
  | "react"
  | "typescript";

/**
 * Lookup map from skill/technology name to its brand icon component
 * (skills-data.ts's `SkillEntry.icon` field indexes into this).
 * Vendored from devicon (MIT) — see docs/third-party-assets.md.
 */
export const SKILL_ICONS: Record<IconName, ComponentType<IconProps>> = {
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
