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
 * documents. Every path this returns is canonicalized and confirmed to be an
 * existing directory before it leaves, because callers use the result to widen
 * a path-containment check: an unvalidated value here would widen it to
 * somewhere that does not exist, or that a malformed pointer chose. Anything
 * unexpected (no `.git`, an unreadable one, a pointer to a non-directory)
 * returns `undefined`, so callers fall back to their normal root.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { isAbsolute, join, resolve, sep } from 'node:path';

const GITDIR_PREFIX = 'gitdir:';

const asExistingDirectory = (path) => {
  if (!existsSync(path)) {
    return undefined;
  }
  return statSync(path).isDirectory() ? path : undefined;
};

const readGitDirPointer = (gitPath, repoRoot) => {
  const line = readFileSync(gitPath, 'utf8').trim();
  if (!line.startsWith(GITDIR_PREFIX)) {
    return undefined;
  }
  const target = line.slice(GITDIR_PREFIX.length).trim();
  if (target === '') {
    return undefined;
  }
  const base = isAbsolute(target) ? target : join(repoRoot, target);
  return asExistingDirectory(resolve(base));
};

export const resolveGitDir = (repoRoot) => {
  const root = resolve(repoRoot);
  const gitPath = join(root, '.git');
  if (!gitPath.startsWith(root + sep)) {
    return undefined;
  }
  if (!existsSync(gitPath)) {
    return undefined;
  }
  try {
    return statSync(gitPath).isDirectory()
      ? gitPath
      : readGitDirPointer(gitPath, root);
  } catch {
    return undefined;
  }
};
