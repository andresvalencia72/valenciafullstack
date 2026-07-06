import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TagPills } from "./tag-pills";

describe("TagPills", () => {
  it("renders each tag prefixed with #", () => {
    render(<TagPills tags={["nextjs", "architecture"]} />);

    expect(screen.getByText("#nextjs")).toBeInTheDocument();
    expect(screen.getByText("#architecture")).toBeInTheDocument();
  });

  it("renders nothing when there are no tags", () => {
    const { container } = render(<TagPills tags={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
