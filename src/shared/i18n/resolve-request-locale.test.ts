import { describe, expect, it } from "vitest";
import { resolveRequestLocale } from "./resolve-request-locale";

const LOCALES = ["es", "en"] as const;

describe("resolveRequestLocale", () => {
  it("returns the requested locale when it is supported", () => {
    expect(resolveRequestLocale("en", LOCALES, "es")).toBe("en");
  });

  it("falls back to the default locale when the requested locale is unsupported", () => {
    expect(resolveRequestLocale("fr", LOCALES, "es")).toBe("es");
  });

  it("falls back to the default locale when nothing was requested", () => {
    expect(resolveRequestLocale(undefined, LOCALES, "es")).toBe("es");
  });
});
