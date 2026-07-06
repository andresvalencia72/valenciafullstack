import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import { mdxComponents } from "./mdx-components";

interface ArticleBodyProps {
  /** Raw MDX body (frontmatter already stripped by the content loader). */
  source: string;
}

/**
 * Compiles and renders an article's MDX body (blog: MDX Article
 * Rendering). Syntax highlighting decision: `rehype-pretty-code` +
 * Shiki, a single fixed dark theme (`one-dark-pro`) regardless of the
 * site's light/dark toggle — this matches design-reference's own code
 * blocks, which are hardcoded dark (`#1a1a1f` background) in every
 * screenshot regardless of the surrounding theme, rather than a
 * per-theme dual-token Shiki setup that the reference never actually
 * uses.
 */
export async function ArticleBody({ source }: ArticleBodyProps) {
  // Called directly (not as `<MDXRemote ... />` JSX) and awaited here so
  // the returned tree is already fully resolved by the time this
  // component's own Promise resolves — `MDXRemote` is itself an async
  // component, and only a real RSC renderer (not `react-dom`'s
  // synchronous client renderer, which is what Vitest/Testing Library
  // uses) can resolve a *nested* async component on its own.
  const compiled = await MDXRemote({
    source,
    components: mdxComponents,
    options: {
      mdxOptions: {
        rehypePlugins: [[rehypePrettyCode, { theme: "one-dark-pro" }]],
      },
    },
  });

  return <div className="pf-prose">{compiled}</div>;
}
