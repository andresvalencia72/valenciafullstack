import { describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY, buildThemeInitScript } from "./theme-init-script";

describe("buildThemeInitScript", () => {
  it("reads the pinned localStorage key", () => {
    const script = buildThemeInitScript();

    expect(THEME_STORAGE_KEY).toBe("pf-theme");
    expect(script).toContain(`localStorage.getItem("${THEME_STORAGE_KEY}")`);
  });

  it("checks the prefers-color-scheme media query as a fallback", () => {
    const script = buildThemeInitScript();

    expect(script).toContain("prefers-color-scheme: dark");
  });

  it("sets data-theme on the document element before paint", () => {
    const script = buildThemeInitScript();

    expect(script).toContain("document.documentElement.dataset.theme");
  });

  it("guards against a throwing localStorage (e.g. privacy mode) without crashing", () => {
    const script = buildThemeInitScript();

    expect(script).toContain("try");
    expect(script).toContain("catch");
  });
});
