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

/** True when `candidate` is `root` itself or sits underneath it. */
const isWithin = (candidate, root) =>
  candidate === root || candidate.startsWith(root + sep);

export const readTextWithin = (path, repoRoot, extraRoots = []) => {
  const resolved = resolve(path);
  const roots = [repoRoot, ...extraRoots].filter(
    (root) => typeof root === 'string' && root !== '',
  );
  if (!roots.some((root) => isWithin(resolved, root))) {
    throw new Error(`refusing to read a file outside the repository: ${path}`);
  }
  return readFileSync(resolved, 'utf8');
};
