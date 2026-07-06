import { useTranslations } from "next-intl";
import { Reveal } from "@/shared/ui/motion/reveal";
import { Tilt } from "@/shared/ui/motion/tilt";
import { ProjectScreenshot } from "./project-screenshot";
import { PROJECTS, type ProjectEntry } from "./projects-data";

/**
 * Projects section: alternating cards (screenshot placeholder + copy),
 * matching design-reference/'s "proyectos" section (home-page: Section
 * Composition — projects). `PROJECTS[0]` is a real, verifiable entry;
 * the remaining two are explicit placeholders (see `projects-data.ts`).
 */
export function ProjectsSection() {
  const t = useTranslations("home.projects");

  return (
    <section
      id="projects"
      className="mx-auto max-w-6xl px-4 py-20 lg:px-8 lg:py-32"
    >
      <Reveal>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 lg:mb-17">
          <h2 className="font-display text-4xl leading-none font-semibold tracking-tight lg:text-7xl">
            {t("heading")}.
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
            {t("subheading")}
          </p>
        </div>
      </Reveal>

      <div className="flex flex-col gap-16 lg:gap-22">
        {PROJECTS.map((project, projectIndex) => (
          <ProjectCard
            key={project.id}
            project={project}
            reverse={projectIndex % 2 === 1}
          />
        ))}
      </div>
    </section>
  );
}

interface ProjectCardProps {
  project: ProjectEntry;
  reverse: boolean;
}

function ProjectCard({ project, reverse }: ProjectCardProps) {
  const t = useTranslations("home.projects");

  return (
    <Reveal>
      <article className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <div className={reverse ? "lg:order-1" : undefined}>
          <Tilt>
            <ProjectScreenshot
              caption={project.screenshotCaption}
              offset={reverse ? "right" : "left"}
            />
          </Tilt>
        </div>
        <div className={reverse ? "lg:order-0" : undefined}>
          <div className="mb-3.5 flex items-center gap-3.5">
            <span className="font-display text-lg font-bold text-coral">
              {project.index}
            </span>
            <span className="font-mono text-xs tracking-widest text-ink-soft uppercase">
              {project.stack} · {project.year}
            </span>
          </div>
          <h3 className="mb-3.5 font-display text-3xl leading-tight font-semibold tracking-tight lg:text-4xl">
            {t(`items.${project.id}.title`)}
          </h3>
          {project.isPlaceholder && (
            <p className="mb-3 inline-flex rounded-full border border-dashed border-line px-3 py-1 font-mono text-xs tracking-wide text-ink-faint uppercase">
              {t("placeholderBadge")}
            </p>
          )}
          <p className="mb-4.5 max-w-xl text-base leading-relaxed text-ink-soft">
            {t(`items.${project.id}.problem`)}{" "}
            {t(`items.${project.id}.solution`)}
          </p>
          <div className="mb-6 flex flex-wrap gap-2">
            {project.techs.map((tech) => (
              <span
                key={tech}
                className="inline-flex rounded-full border border-line px-3.5 py-1.5 text-sm font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-3.5">
            {project.demoHref && (
              <a
                href={project.demoHref}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 border-b-2 border-coral pb-1 text-sm font-semibold text-ink"
              >
                {t("demoLabel")}
              </a>
            )}
            <a
              href={project.repoHref}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 pb-1 text-sm font-semibold text-ink-soft"
            >
              {t("repoLabel")}
            </a>
          </div>
        </div>
      </article>
    </Reveal>
  );
}
