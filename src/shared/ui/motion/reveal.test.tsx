import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Reveal } from "./reveal";
import { usePrefersReducedMotion } from "./prefers-reduced-motion";

vi.mock("./prefers-reduced-motion", () => ({
  usePrefersReducedMotion: vi.fn(),
}));

describe("Reveal", () => {
  beforeEach(() => {
    vi.mocked(usePrefersReducedMotion).mockReturnValue(false);
  });

  it("renders its children", () => {
    render(
      <Reveal>
        <p>About me</p>
      </Reveal>,
    );

    expect(screen.getByText("About me")).toBeInTheDocument();
  });

  it("marks itself as active when motion is not reduced", () => {
    render(
      <Reveal>
        <p>About me</p>
      </Reveal>,
    );

    expect(screen.getByText("About me").closest("[data-motion]")).toHaveAttribute(
      "data-motion",
      "active",
    );
  });

  it("marks itself as reduced and skips animation when motion is reduced", () => {
    vi.mocked(usePrefersReducedMotion).mockReturnValue(true);

    render(
      <Reveal>
        <p>About me</p>
      </Reveal>,
    );

    expect(screen.getByText("About me").closest("[data-motion]")).toHaveAttribute(
      "data-motion",
      "reduced",
    );
  });

  it("forwards a className to the wrapping element, so callers can place it as a sized grid item", () => {
    render(
      <Reveal className="md:col-span-2 md:row-span-2">
        <p>About me</p>
      </Reveal>,
    );

    expect(screen.getByText("About me").closest("[data-motion]")).toHaveClass(
      "md:col-span-2",
      "md:row-span-2",
    );
  });
});
