/**
 * Resolves a checkout's git directory without shelling out to `git`.
 *
 * Why this exists: hook arguments can legitimately point *outside* the working
 * tree. In a linked worktree git passes the commit-message file as
 * `<primary>/.git/worktrees/<name>/COMMIT_EDITMSG`, which is not under the
 * worktree root — so a containment check anchored only on the working tree
 * rejects every commit made from a worktree (see `safe-read.mjs`). Knowing the
 * real git directory lets that check stay strict while still admitting the
 * files git itself hands us.
 *
 * It reads the `.git` entry directly rather than running `git rev-parse`: these
 * scripts stay subprocess-free, both to keep them cheap in a hook and to avoid
 * a PATH-resolved process launch in tooling that runs on every commit.
 *
 * `.git` is a directory in a primary checkout and a file containing
 * `gitdir: <absolute path>` in a linked worktree — the same two shapes git
 * documents. Anything else (no `.git`, an unreadable one, a malformed pointer)
 * returns `undefined`, so callers simply fall back to their normal root.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';

const GITDIR_PREFIX = 'gitdir:';

/** The `gitdir: <path>` pointer inside a linked worktree's `.git` file. */
const readGitDirPointer = (gitPath, repoRoot) => {
  const line = readFileSync(gitPath, 'utf8').trim();
  if (!line.startsWith(GITDIR_PREFIX)) {
    return undefined;
  }
  const target = line.slice(GITDIR_PREFIX.length).trim();
  return target === ''
    ? undefined
    : resolve(isAbsolute(target) ? target : join(repoRoot, target));
};

/**
 * Absolute path to `repoRoot`'s git directory, or `undefined` when it cannot be
 * determined. Never throws — a caller that cannot resolve it is no worse off
 * than before.
 */
export const resolveGitDir = (repoRoot) => {
  const gitPath = join(repoRoot, '.git');
  if (!existsSync(gitPath)) {
    return undefined;
  }
  try {
    return statSync(gitPath).isDirectory()
      ? gitPath
      : readGitDirPointer(gitPath, repoRoot);
  } catch {
    return undefined;
  }
};
