import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vite-plus/test';

import { runCommand } from './command-router.mjs';
import { runWorktreesWith } from './command-worktrees.mjs';
import { silencedConsole } from './test-fixtures.mjs';
import {
  branchNames,
  buildSortingRepository,
  gitIn,
  noContainers,
  pullRequestsFor,
  scratchRoots,
  worktreePaths,
} from './worktree-fixtures.mjs';
import { systemHosts } from './worktree-hosts.mjs';

const { drain, make } = scratchRoots();

afterEach(drain);

const setUp = () => {
  const tree = buildSortingRepository(make());
  const hosts = {
    ...noContainers,
    pullRequests: pullRequestsFor({
      mergedHead: tree.mergedHead,
      supersededHead: gitIn(tree.superseded, 'rev-parse', 'HEAD'),
    }),
  };
  return { hosts, tree };
};

const run = ({ argv, hosts, root }) => {
  const console_ = silencedConsole(vi);
  const code = runWorktreesWith({ argv, hosts, root });
  const out = console_.log.mock.calls.map((call) => call.join(' ')).join('\n');
  const err = console_.error.mock.calls
    .map((call) => call.join(' '))
    .join('\n');
  console_.restore();
  return { code, err, out };
};

const byText = (left, right) => left.localeCompare(right);

const lineFor = (out, path) =>
  out.split('\n').find((line) => line.includes(`${path} (`)) ?? '';

const plannedRemovals = (out) =>
  out
    .split('\n')
    .map(
      (line) =>
        /^ {2}remove(?: \+ delete branch)? +(?<path>\S+) \(/u.exec(line)?.groups
          ?.path,
    )
    .filter((path) => path !== undefined);

describe('devkit worktrees, without --apply', () => {
  test('prints a verdict for every linked worktree and changes nothing', () => {
    const { hosts, tree } = setUp();
    const before = {
      branches: branchNames(tree.repo),
      paths: worktreePaths(tree.repo),
    };

    const { code, out } = run({ argv: [], hosts, root: tree.repo });

    expect(code).toBe(0);
    expect(lineFor(out, tree.merged)).toMatch(
      /^ {2}remove \+ delete branch .*PR #1 merged/u,
    );
    expect(lineFor(out, tree.open)).toMatch(/^ {2}keep .*PR #2 open/u);
    expect(lineFor(out, tree.noPr)).toMatch(
      /^ {2}remove .*no pull request; the branch is kept/u,
    );
    expect(lineFor(out, tree.superseded)).toMatch(
      /^ {2}keep .*--include-superseded removes it/u,
    );
    expect(lineFor(out, tree.unique)).toMatch(/^ {2}keep .*1 match neither/u);
    expect(lineFor(out, tree.detached)).toMatch(
      /^ {2}remove .*its commit is on main/u,
    );
    expect(worktreePaths(tree.repo)).toEqual(before.paths);
    expect(branchNames(tree.repo)).toEqual(before.branches);
  });
});

describe('devkit worktrees --apply', () => {
  test('removes exactly what the plan printed, and nothing else', () => {
    const { hosts, tree } = setUp();
    const planned = run({ argv: [], hosts, root: tree.repo }).out;
    const before = worktreePaths(tree.repo);

    const { code, out } = run({ argv: ['--apply'], hosts, root: tree.repo });

    expect(code).toBe(0);
    expect(out.split('\n').slice(1)).toEqual(planned.split('\n').slice(1));
    const removed = before.filter(
      (path) => !worktreePaths(tree.repo).includes(path),
    );
    expect(removed.toSorted(byText)).toEqual(
      [tree.detached, tree.merged, tree.noPr].toSorted(byText),
    );
    expect(plannedRemovals(planned).toSorted(byText)).toEqual(
      removed.toSorted(byText),
    );
  });

  test('deletes the merged branch and keeps the branch whose pull request never merged', () => {
    const { hosts, tree } = setUp();

    run({ argv: ['--apply'], hosts, root: tree.repo });

    expect(branchNames(tree.repo)).not.toContain('merged');
    expect(branchNames(tree.repo)).toContain('no-pr');
    expect(branchNames(tree.repo)).toContain('open');
  });

  test('--include-superseded removes the dirty worktree whose changes are all in history', () => {
    const { hosts, tree } = setUp();

    const { code, out } = run({
      argv: ['--apply', '--include-superseded'],
      hosts,
      root: tree.repo,
    });

    expect(code).toBe(0);
    expect(lineFor(out, tree.superseded)).toMatch(
      /^ {2}remove \+ delete branch .*superseded: 1 match main/u,
    );
    expect(worktreePaths(tree.repo)).not.toContain(tree.superseded);
  });

  test('keeps the worktree with one unique line under every flag', () => {
    const { hosts, tree } = setUp();
    const flagSets = [
      [],
      ['--apply'],
      ['--include-superseded'],
      ['--apply', '--include-superseded'],
    ];

    for (const argv of flagSets) run({ argv, hosts, root: tree.repo });

    expect(worktreePaths(tree.repo)).toContain(tree.unique);
    expect(branchNames(tree.repo)).toContain('unique');
    expect(readFileSync(join(tree.unique, 'file.txt'), 'utf8')).toBe(
      'two\na line no history holds\n',
    );
  });

  test('keeps a worktree with an untracked file even when every tracked change is in history', () => {
    const { hosts, tree } = setUp();
    writeFileSync(join(tree.superseded, 'notes.txt'), 'never committed\n');

    const { out } = run({
      argv: ['--apply', '--include-superseded'],
      hosts,
      root: tree.repo,
    });

    expect(lineFor(out, tree.superseded)).toMatch(
      /^ {2}keep .*0 match neither, 1 untracked/u,
    );
    expect(worktreePaths(tree.repo)).toContain(tree.superseded);
  });
});

const absentHosts = (root) => {
  const empty = join(root, 'empty-bin');
  mkdirSync(empty);
  return systemHosts({ directories: [empty], pathEntries: [] });
};

describe('devkit worktrees with no gh and no docker on the machine', () => {
  test('still runs, keeps every worktree that needs a pull request state, and says why', () => {
    const root = make();
    const tree = buildSortingRepository(root);
    const before = worktreePaths(tree.repo);

    const { code, out } = run({
      argv: ['--apply'],
      hosts: absentHosts(root),
      root: tree.repo,
    });

    expect(code).toBe(0);
    for (const path of [tree.merged, tree.open, tree.noPr]) {
      expect(lineFor(out, path)).toMatch(
        /^ {2}keep .*pull request state unknown: gh is not installed/u,
      );
    }
    expect(out).toContain(
      'note: kept what needs a pull request state: gh is not installed',
    );
    expect(out).toContain(
      'note: no containers checked: docker is not installed',
    );
    const removed = before.filter(
      (path) => !worktreePaths(tree.repo).includes(path),
    );
    expect(removed).toEqual([tree.detached]);
  });
});

describe('devkit worktrees, through the dispatcher', () => {
  test('refuses an argument it does not know', () => {
    const console_ = silencedConsole(vi);
    const code = runCommand({
      argv: ['worktrees', '--everything'],
      root: make(),
    });
    const err = console_.error.mock.calls.flat().join('\n');
    console_.restore();

    expect(code).toBe(1);
    expect(err).toContain('unexpected argument --everything');
  });
});
