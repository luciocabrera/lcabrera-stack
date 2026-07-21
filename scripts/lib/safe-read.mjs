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
import { resolve, sep } from 'node:path';

export const readTextWithin = (path, repoRoot, extraRoots = []) => {
  const resolved = resolve(path);
  // The read lives inside the containment branch on purpose: the resolved path
  // comes from argv, so it must be provably validated before it reaches the
  // filesystem — for a reader and for taint analysis alike.
  for (const root of [repoRoot, ...extraRoots]) {
    if (typeof root !== 'string' || root === '') {
      continue;
    }
    if (resolved === root || resolved.startsWith(root + sep)) {
      return readFileSync(resolved, 'utf8');
    }
  }
  throw new Error(`refusing to read a file outside the repository: ${path}`);
};
