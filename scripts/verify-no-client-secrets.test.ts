import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("collectClientBundleFiles (security: No Client-Side Secrets)", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "client-bundle-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns an empty array when the directory does not exist", async () => {
    const { collectClientBundleFiles } = await import("./verify-no-client-secrets");

    expect(collectClientBundleFiles(path.join(dir, "missing"))).toEqual([]);
  });

  it("recursively collects .js files only, skipping non-.js files", async () => {
    const { collectClientBundleFiles } = await import("./verify-no-client-secrets");

    mkdirSync(path.join(dir, "chunks"));
    writeFileSync(path.join(dir, "chunks", "app.js"), "console.log('a');");
    writeFileSync(path.join(dir, "styles.css"), "body {}");
    writeFileSync(path.join(dir, "chunks", "map.js.map"), "{}");

    const files = collectClientBundleFiles(dir);

    expect(files).toEqual([
      { path: path.join(dir, "chunks", "app.js"), content: "console.log('a');" },
    ]);
  });
});

describe("readConfiguredSecrets (security: No Client-Side Secrets)", () => {
  it("reads the known secret env var names, defaulting unset ones to an empty string", async () => {
    const { readConfiguredSecrets } = await import("./verify-no-client-secrets");
    vi.stubEnv("DATABASE_URL", "postgres://real-value");
    vi.stubEnv("VISITOR_HASH_SECRET", "");
    vi.stubEnv("RESEND_API_KEY", undefined as unknown as string);
    vi.stubEnv("GITHUB_TOKEN", "");

    const secrets = readConfiguredSecrets();

    expect(secrets).toEqual(
      expect.arrayContaining([
        { name: "DATABASE_URL", value: "postgres://real-value" },
      ]),
    );
    expect(secrets.map((s) => s.name).sort()).toEqual(
      ["DATABASE_URL", "GITHUB_TOKEN", "RESEND_API_KEY", "VISITOR_HASH_SECRET"].sort(),
    );

    vi.unstubAllEnvs();
  });
});

describe("main() (security: No Client-Side Secrets)", () => {
  it("logs success and exits 0 when no secrets are found", async () => {
    const { main } = await import("./verify-no-client-secrets");
    const log = vi.fn();
    const error = vi.fn();
    const exit = vi.fn();

    main([], { log, error, exit });

    expect(log).toHaveBeenCalledWith(
      "verify-no-client-secrets: no configured secret values found in the client bundle.",
    );
    expect(exit).toHaveBeenCalledWith(0);
    expect(error).not.toHaveBeenCalled();
  });

  it("logs an error listing every match and exits 1 when secrets are found", async () => {
    const { main } = await import("./verify-no-client-secrets");
    const log = vi.fn();
    const error = vi.fn();
    const exit = vi.fn();

    main(
      [{ file: "static/chunks/app.js", secretName: "DATABASE_URL" }],
      { log, error, exit },
    );

    expect(error).toHaveBeenCalledWith(
      expect.stringContaining("DATABASE_URL in static/chunks/app.js"),
    );
    expect(exit).toHaveBeenCalledWith(1);
    expect(log).not.toHaveBeenCalled();
  });
});
