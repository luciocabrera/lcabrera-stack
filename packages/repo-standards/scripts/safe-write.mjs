/**
 * Writes a text file whose path came from an untrusted CLI argument, after
 * validating the resolved path stays inside one of the allowed roots. The
 * containment check guards the argv → filesystem write against path traversal
 * (e.g. `--out ../../.git/hooks/pre-commit`), which is the write-side twin of
 * `safe-read.mjs` and is checked the same way for the same reason.
 *
 * What reaches the filesystem is the value `resolveWithin` validated, not the
 * argument it came from — provably so, for a reader and for taint analysis
 * alike. The predicate itself is shared with `safe-read.mjs`.
 */
import { writeFileSync } from 'node:fs';

import { resolveWithin } from './path-containment.mjs';

export const writeTextWithin = (path, text, repoRoot, extraRoots = []) => {
  const resolved = resolveWithin(path, [repoRoot, ...extraRoots]);
  if (resolved === undefined) {
    throw new Error(`refusing to write a file outside the repository: ${path}`);
  }
  writeFileSync(resolved, text, 'utf8');
  return resolved;
};
