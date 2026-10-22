/**
 * The verdicts `housekeeping:prune` added for dirty, detached and locked
 * worktrees, throwaway containers and the session-start hint. A dirty
 * worktree with a change no history holds must survive every flag.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  buildPlan,
  classifyContainers,
  classifyWorktree,
  parseWorktreeState,
  renderHint,
} from './housekeeping-plan.mjs';

const dirtyWorktree = (counts, overrides = {}) => ({
  branch: 'x',
  counts: { base: 0, branch: 0, neither: 0, ...counts },
  dirty: true,
  isPrimary: false,
  untracked: 0,
  ...overrides,
});

describe('classifyWorktree — a dirty worktree judged by content', () => {
  it('reports how its changes split between the two histories', () => {
    expect(
      classifyWorktree(dirtyWorktree({ base: 2, branch: 1, neither: 1 }))
        .reason,
    ).toContain(
      '2 match the default branch, 1 match its own history, 1 match neither, 0 untracked',
    );
  });

  it('keeps a worktree whose every change is in history unless asked', () => {
    expect(classifyWorktree(dirtyWorktree({ base: 2 })).action).toBe('report');
    expect(
      classifyWorktree(dirtyWorktree({ base: 2 }, { includeSuperseded: true })),
    ).toMatchObject({ action: 'remove', force: true });
  });

  it('never removes one with a change no history holds, or an untracked file', () => {
    expect(
      classifyWorktree(
        dirtyWorktree({ base: 5, neither: 1 }, { includeSuperseded: true }),
      ).action,
    ).toBe('report');
    expect(
      classifyWorktree(
        dirtyWorktree({ base: 1 }, { includeSuperseded: true, untracked: 1 }),
      ).action,
    ).toBe('report');
  });
});

describe('classifyWorktree — detached, locked and unknown', () => {
  it('removes a clean detached worktree whose commit the default branch contains', () => {
    expect(
      classifyWorktree({
        branch: undefined,
        dirty: false,
        isPrimary: false,
        onBase: true,
      }).action,
    ).toBe('remove');
  });

  it('keeps a locked worktree', () => {
    expect(
      classifyWorktree({
        branch: 'x',
        dirty: false,
        isPrimary: false,
        locked: true,
        pr: { number: 1, state: 'MERGED' },
      }).action,
    ).toBe('keep');
  });

  it('reports a clean worktree when no pull request data arrived', () => {
    expect(
      classifyWorktree({
        branch: 'x',
        dirty: false,
        hasPrData: false,
        isPrimary: false,
      }),
    ).toMatchObject({
      action: 'report',
      reason: 'no pull request data — kept',
    });
  });
});

describe('parseWorktreeState', () => {
  it("reads each worktree's HEAD, lock and prunable marks", () => {
    const state = parseWorktreeState(
      'worktree /repo\nHEAD aaa\nbranch refs/heads/main\n\nworktree /wt\nHEAD bbb\ndetached\nlocked\nprunable gitdir gone\n',
    );
    expect(state.get('/repo')).toEqual({
      head: 'aaa',
      locked: false,
      prunable: false,
    });
    expect(state.get('/wt')).toEqual({
      head: 'bbb',
      locked: true,
      prunable: true,
    });
  });
});

const isOnDisk = (path) => path === '/work/on-disk';

describe('classifyContainers', () => {
  it('removes a stopped container and one whose worktree is gone, and keeps the rest', () => {
    const plan = classifyContainers({
      containers: [
        { id: '1', name: 'stopped', running: false, worktree: '/work/live' },
        { id: '2', name: 'orphan', running: true, worktree: '/work/gone' },
        { id: '3', name: 'live', running: true, worktree: '/work/live' },
        { id: '4', name: 'on-disk', running: true, worktree: '/work/on-disk' },
        { id: '5', name: 'unnamed', running: true, worktree: '' },
      ],
      isOnDisk,
      live: new Set(['/work/live']),
    });
    expect(plan.map((entry) => entry.action)).toEqual([
      'remove',
      'remove',
      'keep',
      'keep',
      'keep',
    ]);
  });
});

describe('renderHint', () => {
  it('prints only above the threshold', () => {
    expect(renderHint({ count: 11, threshold: 10 })).toContain(
      '11 git worktrees look removable',
    );
    expect(renderHint({ count: 10, threshold: 10 })).toBeUndefined();
  });
});

describe('buildPlan — a removed worktree frees its branch', () => {
  it('deletes the merged branch whose only worktree it removes', () => {
    const plan = buildPlan({
      branches: ['feat/merged'],
      checkedOutBranches: new Set(['feat/merged']),
      currentBranch: 'main',
      keep: new Set(),
      prByHead: new Map([['feat/merged', { number: 1, state: 'MERGED' }]]),
      stashes: [],
      uniqueByBranch: new Map([['feat/merged', 2]]),
      worktrees: [
        { branch: 'feat/merged', dirty: false, isPrimary: false, path: '/wt' },
      ],
    });
    expect(plan.deleteBranches.map((b) => b.name)).toEqual(['feat/merged']);
  });
});

describe('classifyWorktree — a read that failed', () => {
  it('keeps the worktree and names the read, whatever else it looks like', () => {
    expect(
      classifyWorktree({
        branch: 'x',
        dirty: false,
        includeSuperseded: true,
        isPrimary: false,
        pr: { number: 1, state: 'MERGED' },
        unreadable: 'git status',
      }),
    ).toEqual({ action: 'report', reason: 'kept: could not read git status' });
  });
});

describe('classifyContainers — by state', () => {
  const live = new Set(['/work/live']);

  it.each(['restarting', 'paused', 'removing'])(
    'keeps a %s container whose worktree is still there, naming the state',
    (state) => {
      const [verdict] = classifyContainers({
        containers: [
          {
            id: '1',
            name: 'pg',
            running: false,
            state,
            worktree: '/work/live',
          },
        ],
        isOnDisk,
        live,
      });

      expect(verdict).toMatchObject({ action: 'keep' });
      expect(verdict.reason).toContain(state);
    },
  );

  it.each(['exited', 'dead', 'created'])('removes a %s container', (state) => {
    const [verdict] = classifyContainers({
      containers: [
        { id: '1', name: 'pg', running: false, state, worktree: '/work/live' },
      ],
      isOnDisk,
      live,
    });

    expect(verdict).toMatchObject({
      action: 'remove',
      reason: `stopped (${state})`,
    });
  });

  it('removes a paused container whose worktree is gone', () => {
    const [verdict] = classifyContainers({
      containers: [
        {
          id: '1',
          name: 'pg',
          running: false,
          state: 'paused',
          worktree: '/work/gone',
        },
      ],
      isOnDisk,
      live,
    });

    expect(verdict.action).toBe('remove');
  });
});
