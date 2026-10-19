/*
 * Scratch repositories for the `worktrees` suites: one linked worktree of each
 * kind the plan sorts, built with real git so the readers are exercised as a
 * consumer's repository would exercise them.
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runGit } from './git-exec.mjs';

export const gitIn = (cwd, ...args) => runGit({ args, cwd });

const commitAll = (cwd, message) => {
  gitIn(cwd, 'add', '-A');
  gitIn(cwd, 'commit', '-q', '-m', message);
  return gitIn(cwd, 'rev-parse', 'HEAD');
};

const write = (cwd, file, content) => writeFileSync(join(cwd, file), content);

const initRepository = (repo) => {
  gitIn(repo, 'init', '-q', '-b', 'main');
  gitIn(repo, 'config', 'user.email', 'fixture@example.invalid');
  gitIn(repo, 'config', 'user.name', 'Fixture');
  gitIn(repo, 'config', 'commit.gpgsign', 'false');
  gitIn(repo, 'config', 'core.hooksPath', '.no-hooks');
};

export const scratchRoots = () => {
  const made = [];
  return {
    drain: () => {
      for (const path of made.splice(0)) {
        rmSync(path, { force: true, recursive: true });
      }
    },
    make: () => {
      const root = mkdtempSync(join(tmpdir(), 'devkit-worktrees-'));
      made.push(root);
      return root;
    },
  };
};

const addWorktree = ({ from, name, repo, root }) => {
  const path = join(root, name);
  gitIn(repo, 'worktree', 'add', '-q', '-b', name, path, from);
  return path;
};

/**
 * @param {string} root
 */
export const buildSortingRepository = (root) => {
  const repo = join(root, 'repo');
  gitIn(root, 'init', '-q', '-b', 'main', repo);
  initRepository(repo);
  write(repo, 'file.txt', 'one\n');
  const first = commitAll(repo, 'one');

  const merged = addWorktree({ from: 'main', name: 'merged', repo, root });
  write(merged, 'file.txt', 'two\n');
  const mergedHead = commitAll(merged, 'two on the branch');
  write(repo, 'file.txt', 'two\n');
  commitAll(repo, 'two, squashed onto main');

  const open = addWorktree({ from: 'main', name: 'open', repo, root });
  const noPr = addWorktree({ from: 'main', name: 'no-pr', repo, root });
  write(noPr, 'other.txt', 'committed on a branch with no pull request\n');
  commitAll(noPr, 'no pull request');

  const superseded = addWorktree({
    from: first,
    name: 'superseded',
    repo,
    root,
  });
  write(superseded, 'file.txt', 'two\n');

  const unique = addWorktree({ from: 'main', name: 'unique', repo, root });
  write(unique, 'file.txt', 'two\na line no history holds\n');

  const detached = join(root, 'detached');
  gitIn(repo, 'worktree', 'add', '-q', '--detach', detached, first);

  return { detached, merged, mergedHead, noPr, open, repo, superseded, unique };
};

const pullRequestStates = ({ mergedHead, supersededHead }) => ({
  merged: { headRefOid: mergedHead, number: 1, state: 'MERGED' },
  open: { headRefOid: '', number: 2, state: 'OPEN' },
  superseded: { headRefOid: supersededHead, number: 3, state: 'MERGED' },
});

/**
 * @param {{ mergedHead: string, supersededHead: string }} heads
 */
export const pullRequestsFor = (heads) => {
  const states = pullRequestStates(heads);
  return () =>
    ({ branch }) =>
      states[branch] ?? { state: 'NONE' };
};

export const noContainers = {
  containers: () => ({ containers: [] }),
  removeContainer: () => ({ ok: true }),
};

/**
 * @param {string} repo
 */
export const worktreePaths = (repo) =>
  gitIn(repo, 'worktree', 'list', '--porcelain')
    .split('\n')
    .filter((line) => line.startsWith('worktree '))
    .map((line) => line.slice('worktree '.length));

/**
 * @param {string} repo
 */
export const branchNames = (repo) =>
  gitIn(repo, 'branch', '--format=%(refname:short)').split('\n');
