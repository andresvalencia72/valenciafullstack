import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it } from "vitest";
import { mdxComponents } from "./mdx-components";

function asComponent<P>(value: unknown): ComponentType<P> {
  return value as ComponentType<P>;
}

describe("mdxComponents", () => {
  it("renders h2 with the pf-prose heading style", () => {
    const H2 = asComponent<{ children?: React.ReactNode }>(mdxComponents.h2);
    render(<H2>Section heading</H2>);

    expect(
      screen.getByRole("heading", { level: 2, name: "Section heading" }),
    ).toBeInTheDocument();
  });

  it("renders h3 with the pf-prose sub-heading style", () => {
    const H3 = asComponent<{ children?: React.ReactNode }>(mdxComponents.h3);
    render(<H3>Sub heading</H3>);

    expect(
      screen.getByRole("heading", { level: 3, name: "Sub heading" }),
    ).toBeInTheDocument();
  });

  it("renders list items with a diamond marker (::before via className)", () => {
    const Ul = asComponent<{ children?: React.ReactNode }>(mdxComponents.ul);
    const Li = asComponent<{ children?: React.ReactNode }>(mdxComponents.li);
    render(
      <Ul>
        <Li>First point</Li>
      </Ul>,
    );

    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByText("First point")).toBeInTheDocument();
  });

  it("renders inline code (no data-language attribute) with the inline pill style", () => {
    const Code = asComponent<{ children?: React.ReactNode }>(
      mdxComponents.code,
    );
    render(<Code>const x = 1</Code>);

    const code = screen.getByText("const x = 1");
    expect(code.tagName).toBe("CODE");
    expect(code.className).toContain("rounded");
  });

  it("passes block code (with a data-language attribute) through unstyled, letting rehype-pretty-code own it", () => {
    const Code = asComponent<{
      children?: React.ReactNode;
      "data-language"?: string;
    }>(mdxComponents.code);
    render(<Code data-language="ts">const x: number = 1;</Code>);

    const code = screen.getByText("const x: number = 1;");
    expect(code.className).toBe("");
  });

  it("renders a pull-quote blockquote with a coral accent bar", () => {
    const Blockquote = asComponent<{ children?: React.ReactNode }>(
      mdxComponents.blockquote,
    );
    render(<Blockquote>A quote</Blockquote>);

    expect(screen.getByText("A quote")).toBeInTheDocument();
  });

  it("renders links with the coral underline style", () => {
    const A = asComponent<{ children?: React.ReactNode; href?: string }>(
      mdxComponents.a,
    );
    render(<A href="https://example.com">a link</A>);

    expect(screen.getByRole("link", { name: "a link" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
  });
});
