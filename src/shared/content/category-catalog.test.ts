import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import es from "@/shared/i18n/messages/es.json";
import { ARTICLE_CATEGORY_IDS } from "./categories";

/**
 * Enforces that the i18n category catalog (blog.categories.* in both
 * locale message files) has a label for every category id, and vice
 * versa — the static counterpart to the mdx-loader's runtime
 * "unknown category fails the build" check (blog: Category id with no
 * catalog label fails the build).
 */
describe("i18n category catalog", () => {
  it("has an es label for every known category id", () => {
    for (const id of ARTICLE_CATEGORY_IDS) {
      expect(es.blog.categories).toHaveProperty(id);
      expect(typeof es.blog.categories[id as keyof typeof es.blog.categories]).toBe(
        "string",
      );
    }
  });

  it("has an en label for every known category id", () => {
    for (const id of ARTICLE_CATEGORY_IDS) {
      expect(en.blog.categories).toHaveProperty(id);
      expect(typeof en.blog.categories[id as keyof typeof en.blog.categories]).toBe(
        "string",
      );
    }
  });

  it("does not carry catalog labels for unknown category ids", () => {
    const catalogIds = Object.keys(es.blog.categories);
    expect(catalogIds.sort()).toEqual([...ARTICLE_CATEGORY_IDS].sort());
  });
});
