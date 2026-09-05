/**
 * Resolves which working trees belong to this repository, and which transcript
 * directory names belong to those trees.
 *
 * The directory match is a loose prefix, so the roots must be tight: a `.git`
 * pointer is climbed only when it names a `worktrees/` entry, since the other
 * shapes would put every repository under an ancestor in scope.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

const GITDIR_PREFIX = 'gitdir:';

export const gitdirPointer = (contents) => {
  const line = String(contents)
    .split('\n')
    .find((candidate) => candidate.startsWith(GITDIR_PREFIX));
  const pointer = line?.slice(GITDIR_PREFIX.length).trim();
  return pointer === undefined || pointer.length === 0 ? undefined : pointer;
};

const WORKTREES_DIRECTORY = 'worktrees';

const namesALinkedWorktree = (gitdir) =>
  basename(dirname(gitdir)) === WORKTREES_DIRECTORY;

const commonGitDir = (repoRoot) => {
  const dotGit = join(repoRoot, '.git');
  if (!existsSync(dotGit)) {
    return undefined;
  }
  if (statSync(dotGit).isDirectory()) {
    return dotGit;
  }
  const pointer = gitdirPointer(readFileSync(dotGit, 'utf8'));
  if (pointer === undefined) {
    return undefined;
  }
  const gitdir = resolve(repoRoot, pointer);
  return namesALinkedWorktree(gitdir) ? resolve(gitdir, '..', '..') : gitdir;
};

const mainWorkingTree = (gitDir) =>
  basename(gitDir) === '.git' ? [dirname(gitDir)] : [];

const linkedWorktrees = (gitDir) => {
  const worktreesDir = join(gitDir, WORKTREES_DIRECTORY);
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
  return [
    ...new Set([
      ...mainWorkingTree(gitDir),
      repoRoot,
      ...linkedWorktrees(gitDir),
    ]),
  ];
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
