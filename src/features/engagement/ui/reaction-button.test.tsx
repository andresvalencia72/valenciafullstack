import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReactionButton } from "./reaction-button";

describe("ReactionButton", () => {
  it("renders the emoji, label, and count", () => {
    render(
      <ReactionButton
        kind="heart"
        emoji="❤️"
        label="Heart"
        count={5}
        active={false}
        onReact={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: /Heart/ });
    expect(button).toHaveTextContent("❤️");
    expect(button).toHaveTextContent("5");
  });

  it("omits the count badge when count is null (engagement: DB-degraded state hides counts)", () => {
    render(
      <ReactionButton
        kind="heart"
        emoji="❤️"
        label="Heart"
        count={null}
        active={false}
        onReact={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("reaction-count-heart")).not.toBeInTheDocument();
  });

  it("calls onReact with its kind when clicked", () => {
    const onReact = vi.fn();
    render(
      <ReactionButton
        kind="fire"
        emoji="🔥"
        label="Fire"
        count={0}
        active={false}
        onReact={onReact}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Fire/ }));

    expect(onReact).toHaveBeenCalledWith("fire");
  });

  it("marks itself pressed and styled active once already reacted (residual: reacted flag reflected in UI)", () => {
    render(
      <ReactionButton
        kind="thumbs_up"
        emoji="👍"
        label="Thumbs up"
        count={1}
        active
        onReact={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /Thumbs up/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
