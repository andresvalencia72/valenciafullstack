import { describe, expect, it } from "vitest";
import { findLeakedSecrets } from "./find-leaked-secrets";

describe("findLeakedSecrets (security: No Client-Side Secrets)", () => {
  it("returns no matches when no configured secret value appears in any file", () => {
    const matches = findLeakedSecrets(
      [{ path: "chunk-a.js", content: "console.log('hello world');" }],
      [{ name: "DATABASE_URL", value: "postgres://user:pass@host/db" }],
    );

    expect(matches).toEqual([]);
  });

  it("flags a match when a file's content literally contains a secret's value", () => {
    const matches = findLeakedSecrets(
      [
        {
          path: "chunk-b.js",
          content: "const conn = 'postgres://user:pass@host/db';",
        },
      ],
      [{ name: "DATABASE_URL", value: "postgres://user:pass@host/db" }],
    );

    expect(matches).toEqual([{ file: "chunk-b.js", secretName: "DATABASE_URL" }]);
  });

  it("ignores secrets whose value is empty or unset (not configured, nothing to leak)", () => {
    const matches = findLeakedSecrets(
      [{ path: "chunk-c.js", content: "anything at all" }],
      [
        { name: "GITHUB_TOKEN", value: "" },
        { name: "RESEND_API_KEY", value: "   " },
      ],
    );

    expect(matches).toEqual([]);
  });

  it("reports every (file, secret) pair independently across multiple files and secrets", () => {
    const matches = findLeakedSecrets(
      [
        { path: "chunk-a.js", content: "token=super-secret-token" },
        { path: "chunk-b.js", content: "safe content only" },
        {
          path: "chunk-c.js",
          content: "token=super-secret-token and hash=visitor-hash-secret",
        },
      ],
      [
        { name: "GITHUB_TOKEN", value: "super-secret-token" },
        { name: "VISITOR_HASH_SECRET", value: "visitor-hash-secret" },
      ],
    );

    expect(matches).toEqual([
      { file: "chunk-a.js", secretName: "GITHUB_TOKEN" },
      { file: "chunk-c.js", secretName: "GITHUB_TOKEN" },
      { file: "chunk-c.js", secretName: "VISITOR_HASH_SECRET" },
    ]);
  });
});
