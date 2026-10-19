import { describe, expect, test } from 'vite-plus/test';

import {
  planContainers,
  planWorktrees,
  PR_STATES,
  renderPlan,
} from './worktree-plan.mjs';

const OPTIONS = {
  base: 'origin/main',
  baseBranch: 'main',
  includeSuperseded: false,
};

const clean = (overrides) => ({
  branch: 'feature',
  clean: true,
  head: 'a'.repeat(40),
  locked: false,
  onBase: false,
  path: '/work/feature',
  pr: { state: PR_STATES.none },
  untracked: 0,
  ...overrides,
});

const dirty = (counts, overrides = {}) =>
  clean({
    clean: false,
    counts: { base: 0, branch: 0, neither: 0, ...counts },
    ...overrides,
  });

const decide = (facts, options = OPTIONS) =>
  planWorktrees({ facts: [facts], options })[0];

describe('a clean worktree on a branch', () => {
  test('whose pull request merged is removed with its branch', () => {
    const head = 'b'.repeat(40);
    expect(
      decide(
        clean({
          head,
          pr: { headRefOid: head, number: 7, state: PR_STATES.merged },
        }),
      ),
    ).toMatchObject({ action: 'remove', deleteBranch: true, force: false });
  });

  test('whose pull request merged keeps a branch holding commits the merge did not carry', () => {
    expect(
      decide(
        clean({
          pr: {
            headRefOid: 'c'.repeat(40),
            number: 7,
            state: PR_STATES.merged,
          },
        }),
      ),
    ).toMatchObject({ action: 'remove', deleteBranch: false });
  });

  test('whose pull request closed unmerged, or that has none, is removed and its branch kept', () => {
    expect(
      decide(clean({ pr: { number: 3, state: PR_STATES.closed } })),
    ).toMatchObject({
      action: 'remove',
      deleteBranch: false,
    });
    expect(decide(clean())).toMatchObject({
      action: 'remove',
      deleteBranch: false,
    });
  });

  test('whose pull request is open is kept', () => {
    expect(
      decide(clean({ pr: { number: 3, state: PR_STATES.open } })).action,
    ).toBe('keep');
  });

  test('whose pull request state is unknown is kept, naming the reason', () => {
    expect(
      decide(
        clean({
          pr: { reason: 'gh is not installed', state: PR_STATES.unknown },
        }),
      ),
    ).toMatchObject({
      action: 'keep',
      reason: expect.stringContaining('gh is not installed'),
    });
  });

  test('on the default branch is kept whatever its pull request says', () => {
    expect(decide(clean({ branch: 'main' })).action).toBe('keep');
  });

  test('that is locked is kept', () => {
    expect(decide(clean({ locked: true })).action).toBe('keep');
  });
});

describe('a clean detached worktree', () => {
  test('on a commit the default branch contains is removed', () => {
    expect(decide(clean({ branch: undefined, onBase: true }))).toMatchObject({
      action: 'remove',
      deleteBranch: false,
    });
  });

  test('on the head of a merged pull request is removed', () => {
    expect(
      decide(
        clean({
          branch: undefined,
          pr: { number: 9, state: PR_STATES.merged },
        }),
      ).action,
    ).toBe('remove');
  });

  test('on any other commit is kept', () => {
    expect(decide(clean({ branch: undefined })).action).toBe('keep');
    expect(
      decide(
        clean({
          branch: undefined,
          pr: { reason: 'offline', state: PR_STATES.unknown },
        }),
      ),
    ).toMatchObject({
      action: 'keep',
      reason: expect.stringContaining('offline'),
    });
  });
});

describe('a dirty worktree', () => {
  const superseded = dirty({ base: 2, branch: 1 });
  const withSuperseded = { ...OPTIONS, includeSuperseded: true };

  test('reports how its changes split between the two histories', () => {
    expect(decide(dirty({ base: 2, branch: 1, neither: 1 })).reason).toContain(
      '2 match origin/main, 1 match its own history, 1 match neither, 0 untracked',
    );
  });

  test('whose every change is in history is kept without --include-superseded', () => {
    expect(decide(superseded).action).toBe('keep');
  });

  test('whose every change is in history is removed by force with --include-superseded', () => {
    expect(decide(superseded, withSuperseded)).toMatchObject({
      action: 'remove',
      force: true,
    });
  });

  test('with one change no history holds is kept under every flag', () => {
    expect(decide(dirty({ base: 5, neither: 1 }), withSuperseded).action).toBe(
      'keep',
    );
  });

  test('with an untracked file is kept under every flag', () => {
    expect(
      decide(dirty({ base: 1 }, { untracked: 1 }), withSuperseded).action,
    ).toBe('keep');
  });

  test('whose pull request state is unknown is still judged by its content', () => {
    expect(
      decide(
        dirty(
          { base: 1 },
          { pr: { reason: 'gh is not installed', state: PR_STATES.unknown } },
        ),
        withSuperseded,
      ),
    ).toMatchObject({ action: 'remove', deleteBranch: false });
  });
});

const isOnDisk = (path) => path === '/work/on-disk';

describe('planContainers', () => {
  const live = new Set(['/work/live']);

  test('removes a stopped container and one whose worktree is gone', () => {
    const plan = planContainers({
      containers: [
        { id: '1', name: 'stopped', running: false, worktree: '/work/live' },
        { id: '2', name: 'orphan', running: true, worktree: '/work/gone' },
      ],
      isOnDisk,
      live,
    });
    expect(plan.map((entry) => entry.action)).toEqual(['remove', 'remove']);
  });

  test('keeps a running container whose worktree is still there, or that names none', () => {
    const plan = planContainers({
      containers: [
        { id: '1', name: 'live', running: true, worktree: '/work/live' },
        { id: '2', name: 'on-disk', running: true, worktree: '/work/on-disk' },
        { id: '3', name: 'unnamed', running: true, worktree: '' },
      ],
      isOnDisk,
      live,
    });
    expect(plan.map((entry) => entry.action)).toEqual(['keep', 'keep', 'keep']);
  });
});

describe('renderPlan', () => {
  test('says whether it is applying, and lists prunable entries and notes', () => {
    const lines = renderPlan({
      apply: false,
      containers: [],
      notes: ['gh is not installed'],
      prunable: ['/work/vanished'],
      worktrees: [],
    });
    expect(lines[0]).toContain('nothing changes until --apply');
    expect(lines).toContain('  no linked worktrees');
    expect(lines.some((line) => line.includes('/work/vanished'))).toBe(true);
    expect(lines).toContain('note: gh is not installed');
  });
});
