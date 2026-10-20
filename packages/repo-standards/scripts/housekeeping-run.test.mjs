import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { dockerHost } from './housekeeping-containers.mjs';
import {
  branchNames,
  buildSortingRepository,
  noContainers,
  PULL_REQUESTS,
  scratchRoots,
  worktreePaths,
} from './housekeeping-fixtures.mjs';
import { runPrune } from './housekeeping-run.mjs';

const { drain, make } = scratchRoots();

afterEach(drain);

const byText = (left, right) => left.localeCompare(right);

const prune = ({
  argv = [],
  docker = noContainers,
  pullRequests = PULL_REQUESTS,
  repo,
}) => runPrune({ argv, docker, pullRequests, root: repo });

const lineFor = (lines, path) =>
  lines.find((line) => line.includes(`${path} `)) ?? '';

const removedSection = (lines) => {
  const start = lines.findIndex((line) => line.includes('worktrees:'));
  const end = lines.findIndex(
    (line, index) => index > start && line.startsWith('\n'),
  );
  return lines.slice(start + 1, end).filter((line) => line !== '  (none)');
};

describe('housekeeping:prune, dry run', () => {
  it('sorts each kind of worktree and changes nothing', () => {
    const tree = buildSortingRepository(make());
    const before = {
      branches: branchNames(tree.repo),
      paths: worktreePaths(tree.repo),
    };

    const { code, lines } = prune({ repo: tree.repo });

    expect(code).toBe(0);
    const removing = removedSection(lines).join('\n');
    expect(removing).toContain(
      `${tree.merged} [merged] — branch merged merged (PR #1)`,
    );
    expect(removing).toContain(
      `${tree.detached} [detached] — detached on a commit the default branch contains`,
    );
    expect(lineFor(lines, tree.superseded)).toContain(
      '--include-superseded removes it',
    );
    expect(lineFor(lines, tree.unique)).toContain('1 match neither');
    expect(removing).not.toContain(tree.open);
    expect(removing).not.toContain(tree.noPr);
    expect(worktreePaths(tree.repo)).toEqual(before.paths);
    expect(branchNames(tree.repo)).toEqual(before.branches);
  });
});

describe('housekeeping:prune --apply', () => {
  it('removes exactly the worktrees the dry run listed, and deletes the merged branch', () => {
    const tree = buildSortingRepository(make());
    const planned = removedSection(prune({ repo: tree.repo }).lines);
    const before = worktreePaths(tree.repo);

    const { code } = prune({ argv: ['--apply'], repo: tree.repo });

    expect(code).toBe(0);
    const removed = before.filter(
      (path) => !worktreePaths(tree.repo).includes(path),
    );
    expect(removed.toSorted(byText)).toEqual(
      [tree.detached, tree.merged].toSorted(byText),
    );
    expect(planned).toHaveLength(removed.length);
    expect(branchNames(tree.repo)).not.toContain('merged');
    expect(branchNames(tree.repo)).toEqual(
      expect.arrayContaining(['open', 'no-pr', 'unique', 'superseded']),
    );
  });

  it('removes the superseded worktree only with --include-superseded', () => {
    const tree = buildSortingRepository(make());

    const { lines } = prune({
      argv: ['--apply', '--include-superseded'],
      repo: tree.repo,
    });

    expect(lineFor(lines, tree.superseded)).toContain(
      'superseded: 1 match the default branch',
    );
    expect(worktreePaths(tree.repo)).not.toContain(tree.superseded);
  });

  it('keeps the worktree with one unique line under every flag', () => {
    const tree = buildSortingRepository(make());
    const flagSets = [
      [],
      ['--apply'],
      ['--include-superseded'],
      ['--apply', '--include-superseded'],
    ];

    for (const argv of flagSets) prune({ argv, repo: tree.repo });

    expect(worktreePaths(tree.repo)).toContain(tree.unique);
    expect(branchNames(tree.repo)).toContain('unique');
    expect(readFileSync(join(tree.unique, 'file.txt'), 'utf8')).toBe(
      'two\na line no history holds\n',
    );
  });

  it('keeps a worktree with an untracked file even when every tracked change is in history', () => {
    const tree = buildSortingRepository(make());
    writeFileSync(join(tree.superseded, 'notes.txt'), 'never committed\n');

    const { lines } = prune({
      argv: ['--apply', '--include-superseded'],
      repo: tree.repo,
    });

    expect(lineFor(lines, tree.superseded)).toContain(
      '0 match neither, 1 untracked',
    );
    expect(worktreePaths(tree.repo)).toContain(tree.superseded);
  });

  it('removes a stopped or orphaned throwaway container, and lists a running one under KEEPING', () => {
    const tree = buildSortingRepository(make());
    const removed = [];
    const docker = {
      list: () => ({
        containers: [
          { id: 'a', name: 'stopped', running: false, worktree: tree.open },
          {
            id: 'b',
            name: 'orphan',
            running: true,
            worktree: join(tree.repo, '..', 'gone'),
          },
          { id: 'c', name: 'live', running: true, worktree: tree.open },
        ],
      }),
      remove: (id) => {
        removed.push(id);
        return { ok: true };
      },
    };

    const dry = prune({ docker, repo: tree.repo });
    const keeping = dry.lines.slice(
      dry.lines.findIndex((line) => line.includes('KEEPING')),
    );
    expect(keeping).toContain(
      `  container live — running for ${tree.open}, which is still there`,
    );
    expect(keeping.join('\n')).not.toContain('container stopped');
    expect(removed).toEqual([]);

    prune({ argv: ['--apply'], docker, repo: tree.repo });

    expect(removed.toSorted(byText)).toEqual(['a', 'b']);
  });
});

describe('housekeeping:prune with no gh data and no Docker on the machine', () => {
  it('still runs, keeps every worktree that needs a pull request state, and says why', () => {
    const root = make();
    const tree = buildSortingRepository(root);
    const before = worktreePaths(tree.repo);
    const empty = join(root, 'empty-bin');
    mkdirSync(empty);

    const { code, lines } = prune({
      argv: ['--apply'],
      docker: dockerHost([empty]),
      pullRequests: [],
      repo: tree.repo,
    });

    expect(code).toBe(0);
    for (const path of [tree.merged, tree.open, tree.noPr]) {
      expect(lineFor(lines, path)).toContain('no pull request data');
    }
    expect(lines.join('\n')).toContain('note: no pull request data on stdin');
    expect(lines.join('\n')).toContain(
      'note: no containers checked: docker is not installed',
    );
    const removed = before.filter(
      (path) => !worktreePaths(tree.repo).includes(path),
    );
    expect(removed).toEqual([tree.detached]);
  });
});
