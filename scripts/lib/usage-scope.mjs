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
 * `git-remote.mjs` gives: nothing resolves through PATH.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const GITDIR_LINE = /^gitdir:\s*(?<path>.+)$/mu;

const commonGitDir = (repoRoot) => {
  const dotGit = join(repoRoot, '.git');
  if (!existsSync(dotGit)) {
    return undefined;
  }
  if (statSync(dotGit).isDirectory()) {
    return dotGit;
  }
  const pointer = GITDIR_LINE.exec(readFileSync(dotGit, 'utf8'))?.groups?.path;
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
