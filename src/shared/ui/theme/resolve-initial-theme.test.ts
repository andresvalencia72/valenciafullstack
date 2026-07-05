import { describe, expect, it } from "vitest";
import { resolveInitialTheme } from "./resolve-initial-theme";

describe("resolveInitialTheme", () => {
  it("returns the stored theme when it is a valid value", () => {
    expect(resolveInitialTheme("dark", false)).toBe("dark");
  });

  it("returns 'dark' from prefers-color-scheme when nothing is stored", () => {
    expect(resolveInitialTheme(null, true)).toBe("dark");
  });

  it("returns 'light' when nothing is stored and OS does not prefer dark", () => {
    expect(resolveInitialTheme(null, false)).toBe("light");
  });

  it("ignores an invalid stored value and falls back to the OS preference", () => {
    expect(resolveInitialTheme("neon", true)).toBe("dark");
  });

  it("stored 'light' wins even when the OS prefers dark", () => {
    expect(resolveInitialTheme("light", true)).toBe("light");
  });
});
