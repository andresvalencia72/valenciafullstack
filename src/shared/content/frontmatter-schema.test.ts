import { describe, expect, it } from "vitest";
import { frontmatterSchema } from "./frontmatter-schema";

function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Omit<T, K> {
  const copy = { ...obj };
  for (const key of keys) {
    delete copy[key];
  }
  return copy;
}

const validFrontmatter = {
  title: "Clean Architecture in Next.js",
  description: "How screaming architecture keeps features independent.",
  date: "2026-06-14",
  category: "architecture",
  tags: ["nextjs", "architecture"],
  cover: "cover.png",
};

describe("frontmatterSchema", () => {
  it("accepts valid frontmatter with all fields (blog: Valid frontmatter)", () => {
    const result = frontmatterSchema.safeParse(validFrontmatter);

    expect(result.success).toBe(true);
  });

  it("accepts frontmatter without the optional tags/cover fields", () => {
    const required = omit(validFrontmatter, ["tags", "cover"]);

    const result = frontmatterSchema.safeParse(required);

    expect(result.success).toBe(true);
  });

  it.each(["title", "description", "date", "category"] as const)(
    "rejects frontmatter missing the required field %s (blog: Invalid frontmatter)",
    (field) => {
      const rest = omit(validFrontmatter, [field]);

      const result = frontmatterSchema.safeParse(rest);

      expect(result.success).toBe(false);
    },
  );

  it("rejects a non-ISO date string", () => {
    const result = frontmatterSchema.safeParse({
      ...validFrontmatter,
      date: "14 June 2026",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a non-array tags value", () => {
    const result = frontmatterSchema.safeParse({
      ...validFrontmatter,
      tags: "nextjs",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty title", () => {
    const result = frontmatterSchema.safeParse({
      ...validFrontmatter,
      title: "",
    });

    expect(result.success).toBe(false);
  });
});
