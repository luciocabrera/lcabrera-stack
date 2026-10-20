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

  it('is removed with --include-superseded when a branch contains its commit', () => {
    const root = make();
    const repo = baseRepository(root);
    const work = dirtyDetached({ at: 'main', repo, root });

    prune({ argv: ['--apply', '--include-superseded'], repo });

    expect(worktreePaths(repo)).not.toContain(work);
  });
});
