import { describe, expect, it } from "vitest";
import { GITHUB_USERNAME } from "./github-username";

describe("GITHUB_USERNAME", () => {
  it("is the fixed GitHub account this portfolio surfaces activity for, matching the account already linked across features/home/ui", () => {
    expect(GITHUB_USERNAME).toBe("andresvalencia72");
  });
});
