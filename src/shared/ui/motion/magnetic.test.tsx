import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Magnetic } from "./magnetic";
import { usePrefersReducedMotion } from "./prefers-reduced-motion";

vi.mock("./prefers-reduced-motion", () => ({
  usePrefersReducedMotion: vi.fn(),
}));

function mockBounds(element: Element) {
  element.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      width: 200,
      height: 100,
      right: 200,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => "",
    }) as DOMRect;
}

describe("Magnetic", () => {
  beforeEach(() => {
    vi.mocked(usePrefersReducedMotion).mockReturnValue(false);
  });

  it("pulls toward the pointer on pointer move", () => {
    render(
      <Magnetic>
        <button type="button">Hire me</button>
      </Magnetic>,
    );

    const wrapper = screen.getByText("Hire me").closest("[data-motion]");
    mockBounds(wrapper as Element);

    fireEvent.pointerMove(wrapper as Element, { clientX: 200, clientY: 100 });

    expect((wrapper as HTMLElement).style.transform).toBe(
      "translate(30px, 15px)",
    );
  });

  it("returns to neutral on pointer leave", () => {
    render(
      <Magnetic>
        <button type="button">Hire me</button>
      </Magnetic>,
    );

    const wrapper = screen.getByText("Hire me").closest("[data-motion]");
    mockBounds(wrapper as Element);

    fireEvent.pointerMove(wrapper as Element, { clientX: 200, clientY: 100 });
    fireEvent.pointerLeave(wrapper as Element);

    expect((wrapper as HTMLElement).style.transform).toBe(
      "translate(0px, 0px)",
    );
  });

  it("disables the pull entirely when reduced motion is preferred", () => {
    vi.mocked(usePrefersReducedMotion).mockReturnValue(true);

    render(
      <Magnetic>
        <button type="button">Hire me</button>
      </Magnetic>,
    );

    const wrapper = screen.getByText("Hire me").closest("[data-motion]");
    expect(wrapper).toHaveAttribute("data-motion", "reduced");
    mockBounds(wrapper as Element);

    fireEvent.pointerMove(wrapper as Element, { clientX: 200, clientY: 100 });

    expect((wrapper as HTMLElement).style.transform).toBe(
      "translate(0px, 0px)",
    );
  });
});
