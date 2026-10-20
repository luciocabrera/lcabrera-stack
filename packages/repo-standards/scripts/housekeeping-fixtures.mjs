/**
 * Scratch repositories for the housekeeping suites: one linked worktree of
 * each kind the plan sorts, built with real git so the readers run as they
 * would in a consumer's repository.
 */
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runGitStatus } from './git-exec.mjs';

export const gitIn = (cwd, ...args) => {
  const { status, stdout } = runGitStatus({ args, cwd });
  if (status !== 0) throw new Error(`git ${args.join(' ')} failed in ${cwd}`);
  return stdout;
};

const commitAll = (cwd, message) => {
  gitIn(cwd, 'add', '-A');
  gitIn(cwd, 'commit', '-q', '-m', message);
  return gitIn(cwd, 'rev-parse', 'HEAD');
};

const write = (cwd, file, content) => writeFileSync(join(cwd, file), content);

export const configureIdentity = (repo) => {
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
      const root = mkdtempSync(join(tmpdir(), 'repo-housekeeping-'));
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
  configureIdentity(repo);
  write(repo, 'file.txt', 'one\n');
  const first = commitAll(repo, 'one');

  const merged = addWorktree({ from: 'main', name: 'merged', repo, root });
  write(merged, 'file.txt', 'two\n');
  commitAll(merged, 'two on the branch');
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

  return { detached, merged, noPr, open, repo, superseded, unique };
};

/**
 * @param {string} root
 */
export const cloneWithOrigin = (root) => {
  const repo = join(root, 'repo');
  gitIn(root, 'init', '-q', '--bare', '-b', 'main', join(root, 'origin.git'));
  gitIn(root, 'clone', '-q', join(root, 'origin.git'), repo);
  configureIdentity(repo);
  return repo;
};

/**
 * @param {{ gone: number, live: number, root: string }} args
 */
export const repositoryWithGoneBranches = ({ gone, live, root }) => {
  const repo = cloneWithOrigin(root);
  gitIn(repo, 'commit', '-q', '--allow-empty', '-m', 'root');
  gitIn(repo, 'push', '-q', '-u', 'origin', 'main');
  const names = [
    ...Array.from({ length: gone }, (_, index) => `gone-${index}`),
    ...Array.from({ length: live }, (_, index) => `live-${index}`),
  ];
  for (const name of names) {
    gitIn(repo, 'worktree', 'add', '-q', '-b', name, join(root, name), 'main');
    gitIn(repo, 'push', '-q', '-u', 'origin', name);
  }
  const goneNames = names.filter((name) => name.startsWith('gone-'));
  for (const name of goneNames) {
    gitIn(repo, 'push', '-q', 'origin', '--delete', name);
  }
  gitIn(repo, 'fetch', '-q', '--prune');
  return repo;
};

/**
 * A docker that records every call and fails, placed in its own directory so
 * a suite can put it first on PATH and name it outright.
 *
 * @param {string} root
 */
export const recordingDocker = (root) => {
  const directory = join(root, 'stand-in-bin');
  mkdirSync(directory, { recursive: true });
  const path = join(directory, 'docker');
  const marker = join(root, 'docker-was-called');
  writeFileSync(
    path,
    `#!/bin/sh\necho "$@" >> '${marker}'\necho 'STAND-IN DOCKER CALLED' >&2\nexit 97\n`,
  );
  chmodSync(path, 0o755);
  return { directory, path, wasCalled: () => existsSync(marker) };
};

export const PULL_REQUESTS = [
  { headRefName: 'merged', number: 1, state: 'MERGED' },
  { headRefName: 'open', number: 2, state: 'OPEN' },
];

export const noContainers = {
  list: () => ({ containers: [] }),
  remove: () => ({ ok: true }),
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
