import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePrefersReducedMotion } from "./prefers-reduced-motion";

type ChangeHandler = () => void;

function mockMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  let changeHandler: ChangeHandler | undefined;

  const mediaQueryList = {
    get matches() {
      return matches;
    },
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: (_event: string, handler: ChangeHandler) => {
      changeHandler = handler;
    },
    removeEventListener: vi.fn(),
  };

  vi.spyOn(window, "matchMedia").mockReturnValue(
    mediaQueryList as unknown as MediaQueryList,
  );

  return {
    triggerChange(next: boolean) {
      matches = next;
      changeHandler?.();
    },
    removeEventListener: mediaQueryList.removeEventListener,
  };
}

describe("usePrefersReducedMotion (hook)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reflects the OS preference at mount", () => {
    mockMatchMedia(true);

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(true);
  });

  it("reacts live when the OS preference changes", () => {
    const { triggerChange } = mockMatchMedia(false);

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(false);

    act(() => {
      triggerChange(true);
    });

    expect(result.current).toBe(true);
  });

  it("unsubscribes from the media query on unmount", () => {
    const { removeEventListener } = mockMatchMedia(false);

    const { unmount } = renderHook(() => usePrefersReducedMotion());
    unmount();

    expect(removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });
});
