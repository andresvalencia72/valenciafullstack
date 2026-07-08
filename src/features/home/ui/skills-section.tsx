import { useTranslations } from "next-intl";
import { Reveal } from "@/shared/ui/motion/reveal";
import { Tilt } from "@/shared/ui/motion/tilt";
import { LazyIcon } from "./icons/lazy-icon";
import { SkillBadge } from "./skill-badge";
import { SKILLS, type SkillEntry } from "./skills-data";

const SIZE_CLASSES: Record<SkillEntry["size"], string> = {
  default: "",
  wide: "md:col-span-2",
};

/**
 * Skills bento grid (home-page: Section Composition — partial). Bento
 * layout matches design-reference/'s "habilidades" grid: a big
 * main-stack card, four single-skill cards, a wide "learning now" card,
 * then two more single-skill cards.
 */
export function SkillsSection() {
  const t = useTranslations("home.skills");

  return (
    <section
      id="skills"
      className="bg-band px-4 py-20 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="mb-4 flex items-center gap-3.5">
                <span aria-hidden="true" className="h-0.75 w-8.5 bg-coral" />
                <span className="font-mono text-xs tracking-[0.16em] text-ink-soft uppercase">
                  {t("eyebrow")}
                </span>
              </div>
              <h2 className="font-display text-4xl leading-none font-semibold tracking-tight lg:text-7xl">
                <span className="relative rounded-[3px] bg-salmon px-1">
                  {t("heading")}
                </span>
                .
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
              {t("subheading")}
            </p>
          </div>
        </Reveal>

        <div className="grid auto-rows-[minmax(148px,auto)] grid-cols-2 gap-3.5 md:grid-cols-4">
          <Reveal className="md:col-span-2 md:row-span-2">
            <Tilt className="h-full">
              <div className="relative flex h-full min-h-78 flex-col justify-between gap-5 overflow-hidden rounded-[18px] bg-ink p-7 text-bg">
                <div>
                  <span className="font-mono text-xs tracking-widest text-bg/60 uppercase">
                    {t("categories.mainStack")}
                  </span>
                  <div className="mt-4.5 flex flex-col gap-1">
                    <span className="font-display text-3xl leading-tight font-semibold tracking-tight lg:text-4xl">
                      React
                    </span>
                    <span className="font-display text-3xl leading-tight font-semibold tracking-tight lg:text-4xl">
                      TypeScript
                    </span>
                    <span className="font-display text-3xl leading-tight font-semibold tracking-tight text-coral lg:text-4xl">
                      Node.js
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <p className="max-w-xs text-sm leading-snug text-bg/70">
                    {t("descriptions.mainStack")}
                  </p>
                  <div className="flex shrink-0 gap-3.5">
                    <SkillBadge icon="react" />
                    <SkillBadge icon="typescript" />
                    <SkillBadge icon="nodejs" />
                  </div>
                </div>
                <span
                  aria-hidden="true"
                  className="absolute -top-7.5 -right-7.5 h-30 w-30 rounded-full bg-coral opacity-[0.14] blur"
                />
              </div>
            </Tilt>
          </Reveal>

          {SKILLS.map((skill) =>
            skill.size === "wide" ? (
              <Reveal key={skill.category} className={SIZE_CLASSES.wide}>
                <div className="flex items-center justify-between gap-4 rounded-[18px] bg-coral p-6 text-coral-ink">
                  <div>
                    <span className="font-mono text-xs tracking-widest text-coral-ink/85 uppercase">
                      {t(`categories.${skill.category}`)}
                    </span>
                    <h3 className="mt-2 font-display text-2xl font-bold tracking-tight lg:text-4xl">
                      {skill.title}
                    </h3>
                  </div>
                  <LazyIcon
                    icon={skill.icon}
                    className="h-10.5 w-10.5 shrink-0 opacity-95"
                  />
                </div>
              </Reveal>
            ) : (
              <Reveal key={skill.category}>
                <SkillCard
                  skill={skill}
                  categoryLabel={t(`categories.${skill.category}`)}
                  description={t(`descriptions.${skill.category}`)}
                />
              </Reveal>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

interface SkillCardProps {
  skill: SkillEntry;
  categoryLabel: string;
  description: string;
}

function SkillCard({ skill, categoryLabel, description }: SkillCardProps) {
  return (
    <div className="flex h-full flex-col justify-between gap-3.5 rounded-[18px] border border-line bg-card p-5.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs tracking-wide text-ink-faint uppercase">
          {categoryLabel}
        </span>
        <SkillBadge icon={skill.icon} />
      </div>
      <div>
        <h3 className="mb-1 font-display text-xl font-semibold tracking-tight">
          {skill.title}
        </h3>
        <p className="text-sm leading-snug text-ink-soft">{description}</p>
      </div>
    </div>
  );
}
