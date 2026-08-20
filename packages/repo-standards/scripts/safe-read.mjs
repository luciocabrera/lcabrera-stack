/**
 * Reads a text file whose path came from an untrusted CLI argument, after
 * validating the resolved path stays inside one of the allowed roots. The
 * containment check guards the argv → filesystem read against path traversal
 * (e.g. a hook or CI argument like `../../etc/passwd`). See
 * `.claude/rules/scripts.md`.
 *
 * Some callers legitimately read a file that git owns rather than the working
 * tree: a linked worktree's `COMMIT_EDITMSG` lives under
 * `<primary>/.git/worktrees/<name>/`, outside the worktree root. Those callers
 * pass the git directory as an extra root (see `git-dir.mjs`) instead of
 * loosening the check, so traversal outside both roots is still refused.
 */
import { readFileSync } from 'node:fs';

import { resolveWithin } from './path-containment.mjs';

export const readTextWithin = (path, repoRoot, extraRoots = []) => {
  // What reaches the filesystem is the value `resolveWithin` validated, not the
  // argument it came from — provably so, for a reader and for taint analysis
  // alike. The predicate itself is shared with `safe-write.mjs`.
  const resolved = resolveWithin(path, [repoRoot, ...extraRoots]);
  if (resolved === undefined) {
    throw new Error(`refusing to read a file outside the repository: ${path}`);
  }
  return readFileSync(resolved, 'utf8');
};
