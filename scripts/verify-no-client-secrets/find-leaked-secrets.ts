export interface ClientBundleFile {
  path: string;
  content: string;
}

export interface SecretValue {
  name: string;
  value: string;
}

export interface LeakedSecretMatch {
  file: string;
  secretName: string;
}

/**
 * Pure scan: reports every (file, secret) pair where a configured
 * secret's literal runtime value appears inside a client-bundle file's
 * source text (security: No Client-Side Secrets). Secrets with an empty
 * or unset value are skipped — an unconfigured optional secret (e.g.
 * `GITHUB_TOKEN` in an environment that doesn't set it) has no value
 * that could possibly leak, and an empty-string `.includes("")` would
 * match every file trivially.
 */
export function findLeakedSecrets(
  files: ClientBundleFile[],
  secrets: SecretValue[],
): LeakedSecretMatch[] {
  const configuredSecrets = secrets.filter(
    (secret) => secret.value.trim().length > 0,
  );

  const matches: LeakedSecretMatch[] = [];

  for (const file of files) {
    for (const secret of configuredSecrets) {
      if (file.content.includes(secret.value)) {
        matches.push({ file: file.path, secretName: secret.name });
      }
    }
  }

  return matches;
}
