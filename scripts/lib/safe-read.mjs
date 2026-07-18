/**
 * Reads a text file whose path came from an untrusted CLI argument, after
 * validating the resolved path stays inside `repoRoot`. The containment check
 * guards the argv → filesystem read against path traversal (e.g. a hook or CI
 * argument like `../../etc/passwd`). See `.claude/rules/scripts.md`.
 */
import { readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';

export const readTextWithin = (path, repoRoot) => {
  const resolved = resolve(path);
  if (resolved !== repoRoot && !resolved.startsWith(repoRoot + sep)) {
    throw new Error(`refusing to read a file outside the repository: ${path}`);
  }
  return readFileSync(resolved, 'utf8');
};
