/**
 * Writes a text file whose path came from an untrusted CLI argument, after
 * validating the resolved path stays inside one of the allowed roots. The
 * containment check guards the argv → filesystem write against path traversal
 * (e.g. `--out ../../.git/hooks/pre-commit`), which is the write-side twin of
 * `safe-read.mjs` and is checked the same way for the same reason.
 *
 * The write lives inside the containment branch on purpose: the resolved path
 * comes from argv, so it must be provably validated before it reaches the
 * filesystem — for a reader and for taint analysis alike.
 */
import { writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';

export const writeTextWithin = (path, text, repoRoot, extraRoots = []) => {
  const resolved = resolve(path);
  for (const root of [repoRoot, ...extraRoots]) {
    if (typeof root !== 'string' || root === '') {
      continue;
    }
    if (resolved === root || resolved.startsWith(root + sep)) {
      writeFileSync(resolved, text, 'utf8');
      return resolved;
    }
  }
  throw new Error(`refusing to write a file outside the repository: ${path}`);
};
