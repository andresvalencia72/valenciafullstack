import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProjectScreenshot } from "./project-screenshot";

describe("ProjectScreenshot", () => {
  it("renders the screenshot placeholder caption", () => {
    render(<ProjectScreenshot caption="captura · portfolio" offset="left" />);

    expect(screen.getByText("captura · portfolio")).toBeInTheDocument();
  });

  it("exposes the offset direction for the alternating layout", () => {
    render(<ProjectScreenshot caption="captura · x" offset="right" />);

    expect(screen.getByTestId("project-screenshot")).toHaveAttribute(
      "data-offset",
      "right",
    );
  });
});
