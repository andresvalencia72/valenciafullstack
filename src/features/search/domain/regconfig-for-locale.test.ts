import { describe, expect, it } from "vitest";
import { regconfigForLocale } from "./regconfig-for-locale";

describe("regconfigForLocale", () => {
  it("maps 'es' to the 'spanish' Postgres text-search regconfig", () => {
    expect(regconfigForLocale("es")).toBe("spanish");
  });

  it("maps 'en' to the 'english' Postgres text-search regconfig", () => {
    expect(regconfigForLocale("en")).toBe("english");
  });
});
