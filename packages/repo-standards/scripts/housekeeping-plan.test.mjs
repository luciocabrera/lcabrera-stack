/**
 * The cost of a wrong verdict here is deleted work, so the safety rules are
 * pinned directly: a branch with unique un-PR'd commits, a worktree with
 * uncommitted changes, and any stash must survive every classification path.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  buildPlan,
  classifyBranch,
  classifyWorktree,
  parseWorktrees,
  summarizePrs,
} from './housekeeping-plan.mjs';

const branch = (overrides) => ({
  isCheckedOut: false,
  isCurrent: false,
  keep: new Set(),
  name: 'feat/x',
  pr: undefined,
  uniqueCount: 0,
  ...overrides,
});

describe('summarizePrs', () => {
  it('is undefined when a branch never had a PR', () => {
    expect(summarizePrs([])).toBeUndefined();
    expect(summarizePrs(undefined)).toBeUndefined();
  });

  it('lets a single open PR win over merged ones (reopen/re-target)', () => {
    const verdict = summarizePrs([
      { number: 1, state: 'MERGED' },
      { number: 2, state: 'OPEN' },
    ]);
    expect(verdict).toEqual({ number: 2, state: 'OPEN' });
  });

  it('takes the most recent merged/closed when none is open', () => {
    const verdict = summarizePrs([
      { number: 1, state: 'CLOSED' },
      { number: 2, state: 'MERGED' },
    ]);
    expect(verdict).toEqual({ number: 2, state: 'MERGED' });
  });
});

describe('classifyBranch — deletes only what is provably done', () => {
  it('deletes a branch whose PR merged or closed', () => {
    expect(
      classifyBranch(branch({ pr: { number: 9, state: 'MERGED' } })).action,
    ).toBe('delete');
    expect(
      classifyBranch(branch({ pr: { number: 9, state: 'CLOSED' } })).action,
    ).toBe('delete');
  });

  it('deletes a no-PR branch with zero unique commits as cruft', () => {
    expect(
      classifyBranch(branch({ pr: undefined, uniqueCount: 0 })).action,
    ).toBe('delete');
  });
});

describe('classifyBranch — never deletes possible work', () => {
  it('keeps an open PR branch', () => {
    expect(
      classifyBranch(branch({ pr: { number: 9, state: 'OPEN' } })).action,
    ).toBe('keep');
  });

  it('reports (never deletes) a no-PR branch that carries unique commits', () => {
    expect(
      classifyBranch(branch({ pr: undefined, uniqueCount: 3 })).action,
    ).toBe('report');
  });

  it('reports when the origin/main comparison could not be made', () => {
    expect(
      classifyBranch(branch({ pr: undefined, uniqueCount: undefined })).action,
    ).toBe('report');
  });

  it('keeps protected, current, checked-out, and explicitly-kept branches', () => {
    expect(classifyBranch(branch({ name: 'main' })).action).toBe('keep');
    expect(classifyBranch(branch({ name: 'release-1.2' })).action).toBe('keep');
    expect(classifyBranch(branch({ isCurrent: true })).action).toBe('keep');
    expect(classifyBranch(branch({ isCheckedOut: true })).action).toBe('keep');
    expect(classifyBranch(branch({ keep: new Set(['feat/x']) })).action).toBe(
      'keep',
    );
  });

  it('protects even when a PR says merged — trunk is never pruned', () => {
    expect(
      classifyBranch(
        branch({ name: 'main', pr: { number: 1, state: 'MERGED' } }),
      ).action,
    ).toBe('keep');
  });
});

describe('classifyWorktree', () => {
  it('keeps the primary checkout', () => {
    expect(
      classifyWorktree({ branch: 'x', dirty: false, isPrimary: true }).action,
    ).toBe('keep');
  });

  it('reports (never removes) a dirty worktree', () => {
    expect(
      classifyWorktree({
        branch: 'x',
        dirty: true,
        isPrimary: false,
        pr: { number: 1, state: 'MERGED' },
      }).action,
    ).toBe('report');
  });

  it('removes a clean worktree whose branch merged', () => {
    expect(
      classifyWorktree({
        branch: 'x',
        dirty: false,
        isPrimary: false,
        pr: { number: 1, state: 'MERGED' },
      }).action,
    ).toBe('remove');
  });

  it('keeps a clean worktree whose branch is not merged, and reports a detached one', () => {
    expect(
      classifyWorktree({
        branch: 'x',
        dirty: false,
        isPrimary: false,
        pr: undefined,
      }).action,
    ).toBe('keep');
    expect(
      classifyWorktree({ branch: undefined, dirty: false, isPrimary: false })
        .action,
    ).toBe('report');
  });
});

describe('parseWorktrees', () => {
  it('parses porcelain output, flags the primary, and leaves a detached branch undefined', () => {
    const porcelain = [
      'worktree /repo',
      'HEAD abc',
      'branch refs/heads/main',
      '',
      'worktree /repo/../vrc-1',
      'HEAD def',
      'branch refs/heads/feat/y',
      '',
      'worktree /repo/../detached',
      'HEAD 999',
      'detached',
    ].join('\n');
    const parsed = parseWorktrees(porcelain);
    expect(parsed).toEqual([
      { branch: 'main', isPrimary: true, path: '/repo' },
      { branch: 'feat/y', isPrimary: false, path: '/repo/../vrc-1' },
      { branch: undefined, isPrimary: false, path: '/repo/../detached' },
    ]);
  });

  it('returns [] for empty input', () => {
    expect(parseWorktrees('')).toEqual([]);
    expect(parseWorktrees(undefined)).toEqual([]);
  });
});

describe('buildPlan — the safety buckets end to end', () => {
  const plan = buildPlan({
    branches: [
      'main',
      'feat/merged',
      'feat/cruft',
      'feat/unmerged-work',
      'feat/open',
    ],
    checkedOutBranches: new Set(['main']),
    currentBranch: 'main',
    keep: new Set(),
    prByHead: new Map([
      ['feat/merged', { number: 1, state: 'MERGED' }],
      ['feat/open', { number: 2, state: 'OPEN' }],
    ]),
    stashes: ['stash@{0}: WIP on main: something'],
    uniqueByBranch: new Map([
      ['feat/merged', 2],
      ['feat/cruft', 0],
      ['feat/unmerged-work', 4],
      ['feat/open', 1],
    ]),
    worktrees: [
      { branch: 'main', isPrimary: true, path: '/repo', dirty: false },
      {
        branch: 'feat/merged',
        isPrimary: false,
        path: '/wt-merged',
        dirty: false,
      },
      {
        branch: 'feat/unmerged-work',
        isPrimary: false,
        path: '/wt-dirty',
        dirty: true,
      },
    ],
  });

  it('deletes only the merged-PR and cruft branches', () => {
    expect(plan.deleteBranches.map((b) => b.name).sort()).toEqual([
      'feat/cruft',
      'feat/merged',
    ]);
  });

  it('never deletes the branch with unmerged unique commits', () => {
    expect(plan.deleteBranches.map((b) => b.name)).not.toContain(
      'feat/unmerged-work',
    );
    expect(plan.reportBranches.map((b) => b.name)).toContain(
      'feat/unmerged-work',
    );
  });

  it('removes the clean merged worktree but reports the dirty one', () => {
    expect(plan.removeWorktrees.map((w) => w.path)).toEqual(['/wt-merged']);
    expect(plan.reportWorktrees.map((w) => w.path)).toEqual(['/wt-dirty']);
  });

  it('always carries stashes into the report, never an action bucket', () => {
    expect(plan.stashes).toHaveLength(1);
  });
});
