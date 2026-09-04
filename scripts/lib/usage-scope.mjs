/**
 * Resolves which working trees belong to this repository, so the usage reader
 * counts only transcripts recorded while working on it.
 *
 * Claude Code files a transcript under the directory it was launched from, and
 * this repository is worked from several at once (the main checkout plus every
 * linked worktree an agent claims). A reader that looked at one directory would
 * under-report by however many worktrees were live, which is the silent
 * partial-coverage failure the report exists to avoid.
 *
 * Read off the filesystem rather than through a git subprocess, for the reason
 * `git-remote.mjs` gives: nothing resolves through PATH. The pointer inside a
 * worktree's `.git` file is split on lines rather than matched with a pattern,
 * so the cost of reading it stays linear in the file it was handed.
 *
 * A session is launched from a directory, not from a tree, so the directory a
 * transcript is filed under is named for wherever the session started — often a
 * package or an app below the tree root. Matching a transcript directory is
 * therefore a prefix test, and it is deliberately loose: a sibling tree whose
 * path merely starts the same way matches too, and the reader re-checks every
 * entry's own `cwd` against the roots anyway. Over-collecting a directory costs
 * a read; missing one drops every invocation recorded in it.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const GITDIR_PREFIX = 'gitdir:';

export const gitdirPointer = (contents) => {
  const line = String(contents)
    .split('\n')
    .find((candidate) => candidate.startsWith(GITDIR_PREFIX));
  const pointer = line?.slice(GITDIR_PREFIX.length).trim();
  return pointer === undefined || pointer.length === 0 ? undefined : pointer;
};

const commonGitDir = (repoRoot) => {
  const dotGit = join(repoRoot, '.git');
  if (!existsSync(dotGit)) {
    return undefined;
  }
  if (statSync(dotGit).isDirectory()) {
    return dotGit;
  }
  const pointer = gitdirPointer(readFileSync(dotGit, 'utf8'));
  return pointer === undefined
    ? undefined
    : resolve(repoRoot, pointer, '..', '..');
};

const linkedWorktrees = (gitDir) => {
  const worktreesDir = join(gitDir, 'worktrees');
  if (!existsSync(worktreesDir)) {
    return [];
  }
  return readdirSync(worktreesDir)
    .map((name) => join(worktreesDir, name, 'gitdir'))
    .filter((pointer) => existsSync(pointer))
    .map((pointer) => dirname(readFileSync(pointer, 'utf8').trim()));
};

export const repositoryWorkingTrees = (repoRoot) => {
  const gitDir = commonGitDir(repoRoot);
  if (gitDir === undefined) {
    return [repoRoot];
  }
  return [...new Set([dirname(gitDir), repoRoot, ...linkedWorktrees(gitDir)])];
};

export const isWithinAny = ({ path, roots }) =>
  typeof path === 'string' &&
  roots.some((root) => path === root || path.startsWith(`${root}/`));

export const transcriptDirectoryFor = (workingTree) =>
  workingTree.replaceAll(/[^\dA-Za-z]/gu, '-');

export const namesADirectoryUnderAny = ({ directoryName, roots }) =>
  roots.some((root) => {
    const encoded = transcriptDirectoryFor(root);
    return directoryName === encoded || directoryName.startsWith(`${encoded}-`);
  });
