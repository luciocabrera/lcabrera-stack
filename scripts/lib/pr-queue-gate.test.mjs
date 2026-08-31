/**
 * The gate is the operator's leash, so these tests pin the direction it fails
 * in: every uncertainty must resolve toward ESCALATE, never toward ENQUEUE.
 * What the ceiling is worth once computed is `pr-queue-gate-ceiling.test.mjs`.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { publicPackageDirs } from './coverage-workspaces.mjs';
import {
  detectBlockers,
  detectFlags,
  detectStops,
  evaluateGate,
  isVerdict,
} from './pr-queue-gate.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const ROSTER = publicPackageDirs(REPO_ROOT);

const file = (path, additions = 5, deletions = 1) => ({
  additions,
  deletions,
  path,
});

const queue = (overrides = {}) => ({
  ejectedAt: '',
  ejectedReason: '',
  enabled: false,
  position: undefined,
  queued: false,
  state: '',
  ...overrides,
});

const pr = (overrides = {}) => ({
  checks: { all: [{ name: 'CI', state: 'SUCCESS' }], failed: [], pending: [] },
  files: [file('src/thing.ts')],
  headCommittedAt: '2026-08-30T10:00:00Z',
  isDraft: false,
  mergeable: 'MERGEABLE',
  mergeStateStatus: 'CLEAN',
  number: 1,
  queue: queue(),
  reviewDecision: '',
  size: 6,
  threads: { total: 0, unresolved: [] },
  ...overrides,
});

const clean = { body: [], title: [] };

describe('detectStops — mechanically certain §5 triggers', () => {
  it('stops on a removed test file (S2)', () => {
    const stops = detectStops(
      pr({ files: [file('src/thing.test.ts', 0, 40)] }),
    );
    expect(stops.map((stop) => stop.id)).toContain('S2');
  });

  it('does not stop when a test file is merely edited', () => {
    const stops = detectStops(
      pr({ files: [file('src/thing.test.ts', 12, 3)] }),
    );
    expect(stops.map((stop) => stop.id)).not.toContain('S2');
  });

  it('stops on an empty diff (S7)', () => {
    expect(detectStops(pr({ files: [] })).map((s) => s.id)).toContain('S7');
  });

  it('stops on a conflict (S3)', () => {
    expect(
      detectStops(pr({ mergeable: 'CONFLICTING' })).map((s) => s.id),
    ).toContain('S3');
  });

  it('stops when the PR edits the operator or its own policy (S9)', () => {
    expect(
      detectStops(pr({ files: [file('.claude/pr-queue-policy.md')] })).map(
        (s) => s.id,
      ),
    ).toContain('S9');
    expect(
      detectStops(pr({ files: [file('scripts/lib/pr-queue-gate.mjs')] })).map(
        (s) => s.id,
      ),
    ).toContain('S9');
  });

  it('stops on env material and on a suppressions register', () => {
    expect(
      detectStops(pr({ files: [file('docker/local/.env')] })).map((s) => s.id),
    ).toContain('S4');
    expect(
      detectStops(
        pr({ files: [file('packages/ui/eslint-suppressions.json')] }),
      ).map((s) => s.id),
    ).toContain('S5');
  });

  it('leaves an ordinary PR unstopped', () => {
    expect(detectStops(pr())).toEqual([]);
  });
});

const neverBaselineFlagged = (path, packages) =>
  detectFlags(pr({ files: [file(path)] }), packages).some((flag) =>
    /never-baseline/.test(flag.detail),
  );

describe('detectFlags — §5 areas needing the diff read', () => {
  it('flags a touched migration', () => {
    const flags = detectFlags(
      pr({ files: [file('apps/showcase/migrations/0030-x.sql')] }),
      ROSTER,
    );
    expect(flags.map((flag) => flag.id)).toEqual(['S1']);
    expect(flags[0].detail).toMatch(/migration/);
  });

  it('raises both public-package concerns for a public manifest', () => {
    const details = detectFlags(
      pr({ files: [file('packages/ui/package.json')] }),
      ROSTER,
    )
      .filter((flag) => flag.id === 'S1')
      .map((flag) => flag.detail);
    expect(details.some((detail) => /exports map/.test(detail))).toBe(true);
    expect(details.some((detail) => /never-baseline/.test(detail))).toBe(true);
  });

  it('flags an edited test file even though it is not a stop', () => {
    expect(
      detectFlags(pr({ files: [file('src/a.test.ts', 4, 4)] }), ROSTER).map(
        (f) => f.id,
      ),
    ).toContain('S2');
  });

  it('covers every package on the runtime never-baseline roster', () => {
    expect(ROSTER.length).toBeGreaterThan(0);
    for (const dir of ROSTER) {
      expect(neverBaselineFlagged(`${dir}/src/thing.ts`, ROSTER)).toBe(true);
      expect(neverBaselineFlagged(`${dir}/package.json`, ROSTER)).toBe(true);
    }
  });

  it('leaves a workspace off the roster unflagged', () => {
    expect(neverBaselineFlagged('packages/ts-configs/src/x.ts', ROSTER)).toBe(
      false,
    );
    expect(neverBaselineFlagged('apps/showcase/src/x.ts', ROSTER)).toBe(false);
  });

  it.each([
    ['absent', undefined],
    ['empty', []],
  ])(
    'reaches every workspace package when the roster is %s',
    (_label, roster) => {
      expect(neverBaselineFlagged('packages/ts-configs/src/x.ts', roster)).toBe(
        true,
      );
      expect(neverBaselineFlagged('packages/ui/src/x.ts', roster)).toBe(true);
      expect(neverBaselineFlagged('packages/ui/package.json', roster)).toBe(
        true,
      );
      expect(neverBaselineFlagged('scripts/lib/x.mjs', roster)).toBe(false);
    },
  );
});

describe('detectBlockers — §2, each carrying the verdict it forces', () => {
  it('makes a draft WAIT, never ACT (A9 forbids readying it)', () => {
    const blocker = detectBlockers(pr({ isDraft: true }), clean).find(
      (item) => item.id === 'E1',
    );
    expect(blocker.verdict).toBe('WAIT');
  });

  it('makes a pending check WAIT and a failed check ACT', () => {
    const pending = detectBlockers(
      pr({
        checks: {
          all: [{ name: 'CI', state: 'IN_PROGRESS' }],
          failed: [],
          pending: [{ name: 'CI', state: 'IN_PROGRESS' }],
        },
      }),
      clean,
    );
    expect(pending.find((item) => item.id === 'E3').verdict).toBe('WAIT');

    const failed = detectBlockers(
      pr({
        checks: {
          all: [{ name: 'CI', state: 'FAILURE' }],
          failed: [{ name: 'CI', state: 'FAILURE' }],
          pending: [],
        },
      }),
      clean,
    );
    expect(failed.find((item) => item.id === 'E3').verdict).toBe('ACT');
  });

  it('escalates when no checks reported at all', () => {
    const blockers = detectBlockers(
      pr({ checks: { all: [], failed: [], pending: [] } }),
      clean,
    );
    expect(blockers.find((item) => item.id === 'E3').verdict).toBe('ESCALATE');
  });

  it('makes unresolved threads ACT — including an outdated one', () => {
    const blockers = detectBlockers(
      pr({
        threads: {
          total: 1,
          unresolved: [{ author: 'copilot', body: 'x', isOutdated: true }],
        },
      }),
      clean,
    );
    expect(blockers.find((item) => item.id === 'E4').verdict).toBe('ACT');
  });

  it('blocks on a non-conforming title or body', () => {
    const blockers = detectBlockers(pr(), {
      body: ['missing ## What'],
      title: ['not conventional'],
    });
    expect(blockers.map((item) => item.id)).toEqual(
      expect.arrayContaining(['E6', 'E7']),
    );
  });

  it('makes a behind branch ACT so A1 can rebase it', () => {
    const blockers = detectBlockers(pr({ mergeStateStatus: 'BEHIND' }), clean);
    expect(blockers.find((item) => item.id === 'E10').verdict).toBe('ACT');
  });

  it('stops blocking on a behind branch once a queue recomputes the merge', () => {
    const blockers = detectBlockers(
      pr({ mergeStateStatus: 'BEHIND', queue: queue({ enabled: true }) }),
      clean,
    );
    expect(blockers.map((item) => item.id)).not.toContain('E10');
  });

  it('waits on a pull request already in the queue, rather than touching it', () => {
    const blockers = detectBlockers(
      pr({ queue: queue({ enabled: true, queued: true, state: 'QUEUED' }) }),
      clean,
    );
    expect(blockers.find((item) => item.id === 'E11').verdict).toBe('WAIT');
  });
});

describe('detectFlags — an ejection the rollup cannot show', () => {
  const ejected = (overrides) =>
    queue({
      ejectedAt: '2026-08-30T12:00:00Z',
      ejectedReason: 'checks failed',
      enabled: true,
      ...overrides,
    });

  it('flags a pull request the queue removed while its own checks stayed green', () => {
    const flags = detectFlags(
      pr({
        checks: {
          all: [{ name: 'CI', state: 'SUCCESS' }],
          failed: [],
          pending: [],
        },
        queue: ejected(),
      }),
      ROSTER,
    );
    expect(flags.find((flag) => flag.id === 'S11').detail).toContain(
      'checks failed',
    );
  });

  it('clears once the head has moved, so an ejection is not permanent', () => {
    const flags = detectFlags(
      pr({ headCommittedAt: '2026-08-30T13:00:00Z', queue: ejected() }),
      ROSTER,
    );
    expect(flags.map((flag) => flag.id)).not.toContain('S11');
  });

  it('does not flag a pull request that was never ejected', () => {
    const flags = detectFlags(pr({ queue: queue({ enabled: true }) }), ROSTER);
    expect(flags.map((flag) => flag.id)).not.toContain('S11');
  });
});

describe('evaluateGate — the ceiling', () => {
  it('is ENQUEUE only when nothing blocks and nothing stops', () => {
    expect(evaluateGate(pr(), clean).verdict).toBe('ENQUEUE');
  });

  it('lets a flag alone still reach ENQUEUE — the model must discharge it', () => {
    const gate = evaluateGate(
      pr({ files: [file('src/a.test.ts', 3, 3)] }),
      clean,
    );
    expect(gate.verdict).toBe('ENQUEUE');
    expect(gate.flags.map((flag) => flag.id)).toContain('S2');
  });

  it('takes the strictest verdict when blockers disagree', () => {
    const gate = evaluateGate(
      pr({
        checks: {
          all: [{ name: 'CI', state: 'IN_PROGRESS' }],
          failed: [],
          pending: [{ name: 'CI', state: 'IN_PROGRESS' }],
        },
        mergeStateStatus: 'BEHIND',
      }),
      clean,
    );
    expect(gate.verdict).toBe('ACT');
  });

  it('escalates on a stop regardless of how clean everything else is', () => {
    expect(evaluateGate(pr({ files: [] }), clean).verdict).toBe('ESCALATE');
  });

  it('emits only verdicts the vocabulary knows — what `strictest` rests on', () => {
    const everyBlocker = [
      ...detectBlockers(
        pr({
          checks: {
            all: [{ name: 'CI', state: 'FAILURE' }],
            failed: [{ name: 'CI', state: 'FAILURE' }],
            pending: [{ name: 'Sonar', state: 'IN_PROGRESS' }],
          },
          isDraft: true,
          mergeStateStatus: 'BEHIND',
          mergeable: 'UNKNOWN',
          queue: queue({ queued: true }),
          reviewDecision: 'CHANGES_REQUESTED',
          threads: { total: 1, unresolved: [{ path: 'a.ts' }] },
        }),
        { body: ['no ## What'], title: ['not conventional'] },
      ),
      ...detectBlockers(
        pr({ checks: { all: [], failed: [], pending: [] } }),
        clean,
      ),
    ];
    expect(new Set(everyBlocker.map((blocker) => blocker.id))).toEqual(
      new Set(['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E10', 'E11']),
    );
    expect(
      everyBlocker.filter((blocker) => !isVerdict(blocker.verdict)),
    ).toEqual([]);
  });
});
