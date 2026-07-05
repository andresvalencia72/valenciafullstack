import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePrefersReducedMotion } from "./prefers-reduced-motion";
import { Tilt } from "./tilt";

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

describe("Tilt", () => {
  beforeEach(() => {
    vi.mocked(usePrefersReducedMotion).mockReturnValue(false);
  });

  it("tilts toward the pointer on pointer move", () => {
    render(
      <Tilt>
        <span>Card</span>
      </Tilt>,
    );

    const wrapper = screen.getByText("Card").closest("[data-motion]");
    expect(wrapper).not.toBeNull();
    mockBounds(wrapper as Element);

    fireEvent.pointerMove(wrapper as Element, { clientX: 200, clientY: 50 });

    expect((wrapper as HTMLElement).style.transform).toContain(
      "rotateY(10deg)",
    );
  });

  it("returns to neutral on pointer leave", () => {
    render(
      <Tilt>
        <span>Card</span>
      </Tilt>,
    );

    const wrapper = screen.getByText("Card").closest("[data-motion]");
    mockBounds(wrapper as Element);

    fireEvent.pointerMove(wrapper as Element, { clientX: 200, clientY: 50 });
    fireEvent.pointerLeave(wrapper as Element);

    expect((wrapper as HTMLElement).style.transform).toBe(
      "rotateX(0deg) rotateY(0deg)",
    );
  });

  it("disables tilt entirely when reduced motion is preferred", () => {
    vi.mocked(usePrefersReducedMotion).mockReturnValue(true);

    render(
      <Tilt>
        <span>Card</span>
      </Tilt>,
    );

    const wrapper = screen.getByText("Card").closest("[data-motion]");
    expect(wrapper).toHaveAttribute("data-motion", "reduced");
    mockBounds(wrapper as Element);

    fireEvent.pointerMove(wrapper as Element, { clientX: 200, clientY: 50 });

    expect((wrapper as HTMLElement).style.transform).toBe(
      "rotateX(0deg) rotateY(0deg)",
    );
  });
});
