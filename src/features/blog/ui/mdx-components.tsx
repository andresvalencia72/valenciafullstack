import type { MDXComponents } from "mdx/types";
import type { ComponentPropsWithoutRef } from "react";
import { YoutubeEmbed } from "./youtube-embed";

/**
 * MDX component overrides matching design-reference's `.pf-prose`
 * article-body typography (article body: MDX Article Rendering).
 *
 * `pre`/`code`: rehype-pretty-code (Shiki) pre-renders fenced code
 * blocks into a `<pre><code data-language="...">...</code></pre>` tree
 * with syntax-highlighting already baked into inline `<span>` styles —
 * our overrides only add the *container* look (dark rounded card) and
 * must NOT touch `children`, or the highlighting is lost. Inline code
 * (single backticks) never gets a `data-language` attribute (rehype-
 * pretty-code only transforms fenced/mdast `code` nodes, not
 * `inlineCode`), which is how `code` tells the two cases apart.
 */
export const mdxComponents: MDXComponents = {
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h2
      className="mt-12 mb-4.5 font-display text-3xl leading-tight font-semibold tracking-tight lg:text-4xl"
      {...props}
    />
  ),
  h3: (props: ComponentPropsWithoutRef<"h3">) => (
    <h3
      className="mt-8.5 mb-3 font-display text-xl font-semibold tracking-tight lg:text-2xl"
      {...props}
    />
  ),
  p: (props: ComponentPropsWithoutRef<"p">) => (
    <p className="mb-5.5 text-lg leading-relaxed text-ink-soft" {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul className="mb-5.5 flex list-none flex-col gap-3 p-0" {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<"li">) => (
    <li
      className="relative pl-7 text-lg leading-relaxed text-ink-soft before:absolute before:top-2.5 before:left-1 before:h-2 before:w-2 before:rotate-45 before:rounded-[2px] before:bg-coral before:content-['']"
      {...props}
    />
  ),
  strong: (props: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-ink" {...props} />
  ),
  a: (props: ComponentPropsWithoutRef<"a">) => (
    <a
      className="border-b-2 border-coral font-semibold text-ink no-underline"
      {...props}
    />
  ),
  blockquote: ({ children, ...props }: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="relative mb-7 border-none py-1.5 pl-6.5 [&>p]:m-0! [&>p]:font-display! [&>p]:text-2xl! [&>p]:leading-snug! [&>p]:font-medium! [&>p]:text-ink! lg:[&>p]:text-3xl!"
      {...props}
    >
      <span
        aria-hidden
        className="absolute top-1 bottom-1 left-0 w-1 rounded bg-coral"
      />
      {children}
    </blockquote>
  ),
  code: ({
    className,
    children,
    ...props
  }: ComponentPropsWithoutRef<"code"> & { "data-language"?: string }) => {
    const isBlockCode = props["data-language"] !== undefined;

    if (isBlockCode) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }

    return (
      <code
        className="rounded-md bg-[color-mix(in_srgb,var(--coral)_16%,transparent)] px-1.5 py-0.5 font-mono text-[0.88em] text-ink"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: (props: ComponentPropsWithoutRef<"pre">) => (
    <pre
      className="mb-7 overflow-x-auto rounded-xl border border-white/10 bg-[#1a1a1f] p-5.5 font-mono text-sm leading-relaxed"
      {...props}
    />
  ),
  YoutubeEmbed,
};
