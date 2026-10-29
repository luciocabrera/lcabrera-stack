/**
 * The cases where the plan and `--apply` could disagree: a worktree entry
 * whose directory is gone, a superseded worktree's branch, and a branch whose
 * upstream a pruning fetch removed.
 */
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
  branchNames,
  buildSortingRepository,
  cloneWithOrigin,
  configureIdentity,
  gitIn,
  noContainers,
  PULL_REQUESTS,
  worktreePaths,
} from './housekeeping-fixtures.mjs';
import { runPrune } from './housekeeping-run.mjs';
import { createFixtureRoots } from './repo-fixtures.mjs';

const { make, removeAll: drain } = createFixtureRoots('repo-housekeeping-');

afterEach(drain);

const commitAll = (cwd, message) => {
  gitIn(cwd, 'add', '-A');
  gitIn(cwd, 'commit', '-q', '-m', message);
};

const sectionAfter = (lines, heading) => {
  const start = lines.findIndex((line) => line.includes(heading));
  const end = lines.findIndex(
    (line, index) => index > start && line.startsWith('\n'),
  );
  return lines.slice(start + 1, end === -1 ? undefined : end);
};

const buildStaleEntry = () => {
  const root = make();
  const repo = join(root, 'repo');
  gitIn(root, 'init', '-q', '-b', 'main', repo);
  configureIdentity(repo);
  writeFileSync(join(repo, 'a.txt'), '1\n');
  commitAll(repo, 'one');
  const gone = join(root, 'gone');
  gitIn(repo, 'worktree', 'add', '-q', '-b', 'gone', gone, 'main');
  writeFileSync(join(gone, 'a.txt'), '2\n');
  commitAll(gone, 'two');
  rmSync(gone, { force: true, recursive: true });
  return { gone, repo };
};

describe('a merged branch held by a worktree whose directory is gone', () => {
  const pullRequests = [{ headRefName: 'gone', number: 1, state: 'MERGED' }];

  it('is planned for pruning and deletion, and --apply carries out both and exits 0', () => {
    const { gone, repo } = buildStaleEntry();

    const dry = runPrune({
      argv: [],
      docker: noContainers,
      pullRequests,
      root: repo,
    });
    expect(sectionAfter(dry.lines, 'branches')).toContain(
      '  gone — PR #1 merged',
    );
    expect(sectionAfter(dry.lines, 'stale worktree entries')).toContain(
      `  ${gone} — its directory is gone`,
    );
    expect(sectionAfter(dry.lines, 'KEEPING').join('\n')).not.toContain(gone);

    const applied = runPrune({
      argv: ['--apply'],
      docker: noContainers,
      pullRequests,
      root: repo,
    });

    expect(applied.errors).toEqual([]);
    expect(applied.code).toBe(0);
    expect(branchNames(repo)).not.toContain('gone');
    expect(worktreePaths(repo)).not.toContain(gone);
  });
});

describe('a worktree removed as superseded', () => {
  it('keeps its branch, whatever its pull request says', () => {
    const tree = buildSortingRepository(make());
    const pullRequests = [
      ...PULL_REQUESTS,
      { headRefName: 'superseded', number: 3, state: 'CLOSED' },
    ];

    runPrune({
      argv: ['--apply', '--include-superseded'],
      docker: noContainers,
      pullRequests,
      root: tree.repo,
    });

    expect(worktreePaths(tree.repo)).not.toContain(tree.superseded);
    expect(branchNames(tree.repo)).toContain('superseded');
  });
});

describe('a dirty worktree whose branch upstream is gone', () => {
  it('still matches a change against its own history', () => {
    const root = make();
    const repo = cloneWithOrigin(root);
    writeFileSync(join(repo, 'a.txt'), 'base\n');
    commitAll(repo, 'base');
    gitIn(repo, 'push', '-q', '-u', 'origin', 'main');
    const work = join(root, 'feat');
    gitIn(repo, 'worktree', 'add', '-q', '-b', 'feat', work, 'main');
    writeFileSync(join(work, 'a.txt'), 'first draft\n');
    commitAll(work, 'first draft');
    writeFileSync(join(work, 'a.txt'), 'second draft\n');
    commitAll(work, 'second draft');
    gitIn(work, 'push', '-q', '-u', 'origin', 'feat');
    gitIn(repo, 'push', '-q', 'origin', '--delete', 'feat');
    gitIn(repo, 'fetch', '-q', '--prune');
    writeFileSync(join(work, 'a.txt'), 'first draft\n');

    const { lines } = runPrune({
      argv: [],
      docker: noContainers,
      pullRequests: PULL_REQUESTS,
      root: repo,
    });

    expect(lines.find((line) => line.includes(work))).toContain(
      '0 match the default branch, 1 match its own history, 0 match neither',
    );
  });
});
