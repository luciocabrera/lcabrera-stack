/**
 * Two dirty worktrees `--include-superseded` must never remove: one whose only
 * change deletes a file the default branch never had, and one detached on a
 * commit no ref contains, whose HEAD would go with it.
 */
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
  configureIdentity,
  gitIn,
  noContainers,
  scratchRoots,
  worktreePaths,
} from './housekeeping-fixtures.mjs';
import { runPrune } from './housekeeping-run.mjs';

const { drain, make } = scratchRoots();

afterEach(drain);

const ALL_FLAGS = [
  [],
  ['--apply'],
  ['--include-superseded'],
  ['--apply', '--include-superseded'],
];

const commitAll = (cwd, message) => {
  gitIn(cwd, 'add', '-A');
  gitIn(cwd, 'commit', '-q', '-m', message);
  return gitIn(cwd, 'rev-parse', 'HEAD');
};

const baseRepository = (root) => {
  const repo = join(root, 'repo');
  gitIn(root, 'init', '-q', '-b', 'main', repo);
  configureIdentity(repo);
  writeFileSync(join(repo, 'a.txt'), 'one\n');
  commitAll(repo, 'one');
  writeFileSync(join(repo, 'a.txt'), 'two\n');
  commitAll(repo, 'two');
  return repo;
};

const prune = ({ argv, repo }) =>
  runPrune({ argv, docker: noContainers, pullRequests: [], root: repo });

const lineFor = (lines, path) =>
  lines.find((line) => line.includes(`${path} `)) ?? '';

describe('an uncommitted deletion of a file only its own branch has', () => {
  it('matches neither history and survives every flag', () => {
    const root = make();
    const repo = baseRepository(root);
    const work = join(root, 'feat');
    gitIn(repo, 'worktree', 'add', '-q', '-b', 'feat', work, 'main');
    writeFileSync(join(work, 'new.ts'), 'export const value = 1;\n');
    commitAll(work, 'add new.ts');
    rmSync(join(work, 'new.ts'));

    const { lines } = prune({ argv: [], repo });
    for (const argv of ALL_FLAGS) prune({ argv, repo });

    expect(lineFor(lines, work)).toContain(
      '0 match the default branch, 0 match its own history, 1 match neither',
    );
    expect(worktreePaths(repo)).toContain(work);
  });
});

const dirtyDetached = ({ at, repo, root }) => {
  const work = join(root, 'detached-dirty');
  gitIn(repo, 'worktree', 'add', '-q', '--detach', work, at);
  writeFileSync(join(work, 'a.txt'), 'one\n');
  return work;
};

describe('a dirty detached worktree whose every change is in history', () => {
  it('is kept when no branch, tag or remote contains its commit', () => {
    const root = make();
    const repo = baseRepository(root);
    gitIn(repo, 'branch', 'scratch', 'main');
    const scratch = join(root, 'scratch');
    gitIn(repo, 'worktree', 'add', '-q', scratch, 'scratch');
    writeFileSync(join(scratch, 'b.txt'), 'only here\n');
    const orphan = commitAll(scratch, 'only on scratch');
    gitIn(repo, 'worktree', 'remove', scratch);
    gitIn(repo, 'branch', '-D', 'scratch');
    const work = dirtyDetached({ at: orphan, repo, root });

    const { lines } = prune({
      argv: ['--apply', '--include-superseded'],
      repo,
    });

    expect(lineFor(lines, work)).toContain('no branch, tag or remote contains');
    expect(worktreePaths(repo)).toContain(work);
  });

  it.each([
    ['refs/worktree/mine', 'a per-worktree ref'],
    ['refs/bisect/bad', 'a bisect ref'],
  ])('is kept when only %s (%s) contains its commit', (ref) => {
    const root = make();
    const repo = baseRepository(root);
    const work = dirtyDetached({ at: 'main', repo, root });
    writeFileSync(
      join(work, 'pinned.txt'),
      'held only by a ref the removal deletes\n',
    );
    gitIn(work, 'add', 'pinned.txt');
    gitIn(work, 'commit', '-q', '-m', 'pinned');
    gitIn(work, 'update-ref', ref, 'HEAD');

    for (const argv of ALL_FLAGS) prune({ argv, repo });

    expect(worktreePaths(repo)).toContain(work);
  });

  it('is removed with --include-superseded when a branch contains its commit', () => {
    const root = make();
    const repo = baseRepository(root);
    const work = dirtyDetached({ at: 'main', repo, root });

    prune({ argv: ['--apply', '--include-superseded'], repo });

    expect(worktreePaths(repo)).not.toContain(work);
  });
});

describe('a superseded detached worktree held only by a branch this run deletes', () => {
  it('is kept, so the run never leaves its commit unreferenced', () => {
    const root = make();
    const repo = baseRepository(root);
    gitIn(repo, 'branch', 'closed', 'main');
    const holder = join(root, 'holder');
    gitIn(repo, 'worktree', 'add', '-q', holder, 'closed');
    writeFileSync(join(holder, 'c.txt'), 'only on the closed branch\n');
    const head = commitAll(holder, 'only on closed');
    gitIn(repo, 'worktree', 'remove', holder);
    const work = dirtyDetached({ at: head, repo, root });

    const { lines } = runPrune({
      argv: ['--apply', '--include-superseded'],
      docker: noContainers,
      pullRequests: [{ headRefName: 'closed', number: 9, state: 'CLOSED' }],
      root: repo,
    });

    expect(lineFor(lines, work)).toContain(
      'only branches this run deletes contain its commit',
    );
    expect(worktreePaths(repo)).toContain(work);
    expect(gitIn(repo, 'cat-file', '-t', head)).toBe('commit');
  });
});

describe('a worktree whose status cannot be read', () => {
  it('is kept under every flag, and its merged branch is not deleted', () => {
    const root = make();
    const repo = baseRepository(root);
    const work = join(root, 'unreadable');
    gitIn(repo, 'worktree', 'add', '-q', '-b', 'unreadable', work, 'main');
    writeFileSync(join(work, '.git'), 'gitdir: /nonexistent/worktree\n');
    const pullRequests = [
      { headRefName: 'unreadable', number: 5, state: 'MERGED' },
    ];

    const { lines } = runPrune({
      argv: [],
      docker: noContainers,
      pullRequests,
      root: repo,
    });
    for (const argv of ALL_FLAGS) {
      runPrune({ argv, docker: noContainers, pullRequests, root: repo });
    }

    expect(lineFor(lines, work)).toContain('kept: could not read git status');
    expect(worktreePaths(repo)).toContain(work);
    expect(
      gitIn(repo, 'branch', '--format=%(refname:short)').split('\n'),
    ).toContain('unreadable');
  });
});
