import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PhotoFrame } from "./photo-frame";

describe("PhotoFrame", () => {
  it("renders the placeholder label", () => {
    render(<PhotoFrame label="foto · retrato" offset="right" />);

    expect(screen.getByText("foto · retrato")).toBeInTheDocument();
  });

  it("exposes the offset direction for styling", () => {
    render(<PhotoFrame label="foto · trabajando" offset="left" />);

    expect(screen.getByTestId("photo-frame")).toHaveAttribute(
      "data-offset",
      "left",
    );
  });
});
