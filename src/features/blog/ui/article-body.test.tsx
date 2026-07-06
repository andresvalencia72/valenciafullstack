import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { ArticleBody } from "./article-body";

const SOURCE = `
Intro paragraph with \`inline code\`.

## A heading

- First point
- Second point

\`\`\`ts
const x: number = 1;
\`\`\`

> A pull quote.

<YoutubeEmbed videoId="abc123" />
`;

describe("ArticleBody", () => {
  it("renders MDX content: headings, lists, inline code, fenced code blocks, blockquotes, and custom components", async () => {
    const element = await ArticleBody({ source: SOURCE });
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        {element}
      </NextIntlClientProvider>,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "A heading" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByText("inline code")).toBeInTheDocument();
    expect(screen.getByText("A pull quote.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Watch on YouTube" }),
    ).toHaveAttribute("data-video-id", "abc123");

    // Fenced code block: rehype-pretty-code should have compiled it into
    // a syntax-highlighted <code data-language="ts"> (blog: MDX Article
    // Rendering — code blocks render with syntax highlighting).
    const codeBlock = document.querySelector("code[data-language='ts']");
    expect(codeBlock).not.toBeNull();
    expect(codeBlock?.textContent).toContain("const x: number = 1;");
  });
});
