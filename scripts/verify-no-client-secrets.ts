import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  findLeakedSecrets,
  type ClientBundleFile,
  type LeakedSecretMatch,
  type SecretValue,
} from "./verify-no-client-secrets/find-leaked-secrets";

/**
 * `next build`'s client bundle output — server-only code (`.next/server`)
 * legitimately references secret env var names/values (that's where
 * `getEnv()` actually runs) and is intentionally NOT scanned here; only
 * `.next/static` (what actually ships to the browser) matters for
 * security: No Client-Side Secrets.
 */
const CLIENT_BUNDLE_DIR = path.join(process.cwd(), ".next", "static");

/** Every secret-shaped env var in the schema (see shared/config/env.ts). */
const SECRET_ENV_VAR_NAMES = [
  "DATABASE_URL",
  "VISITOR_HASH_SECRET",
  "RESEND_API_KEY",
  "GITHUB_TOKEN",
] as const;

/**
 * Recursively walks `dir` and reads every `.js` file's content. Returns
 * `[]` for a missing directory (e.g. `next build` was never run) rather
 * than throwing — the CLI entry point below turns that into an explicit,
 * actionable error message instead of an unhandled `ENOENT`.
 */
export function collectClientBundleFiles(dir: string): ClientBundleFile[] {
  if (!existsSync(dir)) {
    return [];
  }

  const files: ClientBundleFile[] = [];

  const walk = (currentDir: string): void => {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".js")) {
        files.push({ path: fullPath, content: readFileSync(fullPath, "utf8") });
      }
    }
  };

  walk(dir);
  return files;
}

/** Reads the current runtime value of every known secret env var. */
export function readConfiguredSecrets(): SecretValue[] {
  return SECRET_ENV_VAR_NAMES.map((name) => ({
    name,
    value: process.env[name] ?? "",
  }));
}

export function runVerifyNoClientSecrets(
  files: ClientBundleFile[] = collectClientBundleFiles(CLIENT_BUNDLE_DIR),
  secrets: SecretValue[] = readConfiguredSecrets(),
): LeakedSecretMatch[] {
  return findLeakedSecrets(files, secrets);
}

export interface VerifyNoClientSecretsIo {
  log: (message: string) => void;
  error: (message: string) => void;
  exit: (code: number) => void;
}

const DEFAULT_IO: VerifyNoClientSecretsIo = {
  log: (message) => console.log(message),
  error: (message) => console.error(message),
  exit: (code) => process.exit(code),
};

/**
 * Thin CLI dispatch, same "thin adapter, testable core" split as
 * `scripts/sync-search.ts`'s `main()` — only the trivial `isMainModule`
 * guard below stays untested.
 */
export function main(
  matches: LeakedSecretMatch[] = runVerifyNoClientSecrets(),
  io: VerifyNoClientSecretsIo = DEFAULT_IO,
): void {
  if (matches.length === 0) {
    io.log(
      "verify-no-client-secrets: no configured secret values found in the client bundle.",
    );
    io.exit(0);
    return;
  }

  io.error(
    `verify-no-client-secrets: FOUND ${matches.length} leaked secret occurrence(s):\n` +
      matches
        .map((match) => `  - ${match.secretName} in ${match.file}`)
        .join("\n"),
  );
  io.exit(1);
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  main();
}
