/**
 * The gate is the operator's leash, so these tests pin the direction it fails
 * in: every uncertainty must resolve toward ESCALATE, never toward MERGE. The
 * ceiling test is the important one — it is what stops a model reasoning its way
 * past a hard stop.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  detectBlockers,
  detectFlags,
  detectStops,
  evaluateGate,
  isWithinCeiling,
} from './pr-queue-gate.mjs';

const file = (path, additions = 5, deletions = 1) => ({
  additions,
  deletions,
  path,
});

const pr = (overrides = {}) => ({
  checks: { all: [{ name: 'CI', state: 'SUCCESS' }], failed: [], pending: [] },
  files: [file('src/thing.ts')],
  isDraft: false,
  mergeable: 'MERGEABLE',
  mergeStateStatus: 'CLEAN',
  number: 1,
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

describe('detectFlags — §5 areas needing the diff read', () => {
  it('flags a touched migration', () => {
    const flags = detectFlags(
      pr({ files: [file('packages/scan-ingestion/migrations/0030-x.sql')] }),
    );
    expect(flags.map((flag) => flag.id)).toEqual(['S1']);
    expect(flags[0].detail).toMatch(/migration/);
  });

  it('raises both public-package concerns for a public manifest', () => {
    const details = detectFlags(
      pr({ files: [file('packages/ui/package.json')] }),
    )
      .filter((flag) => flag.id === 'S1')
      .map((flag) => flag.detail);
    expect(details.some((detail) => /exports map/.test(detail))).toBe(true);
    expect(details.some((detail) => /never-baseline/.test(detail))).toBe(true);
  });

  it('flags an edited test file even though it is not a stop', () => {
    expect(
      detectFlags(pr({ files: [file('src/a.test.ts', 4, 4)] })).map(
        (f) => f.id,
      ),
    ).toContain('S2');
  });
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
});

describe('evaluateGate — the ceiling', () => {
  it('is MERGE only when nothing blocks and nothing stops', () => {
    expect(evaluateGate(pr(), clean).verdict).toBe('MERGE');
  });

  it('lets a flag alone still reach MERGE — the model must discharge it', () => {
    const gate = evaluateGate(
      pr({ files: [file('src/a.test.ts', 3, 3)] }),
      clean,
    );
    expect(gate.verdict).toBe('MERGE');
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
});

describe('isWithinCeiling — the model may only tighten', () => {
  it('allows tightening', () => {
    expect(isWithinCeiling('MERGE', 'ESCALATE')).toBe(true);
    expect(isWithinCeiling('ACT', 'ESCALATE')).toBe(true);
    expect(isWithinCeiling('WAIT', 'WAIT')).toBe(true);
  });

  it('refuses any loosening — the whole point of the leash', () => {
    expect(isWithinCeiling('ESCALATE', 'MERGE')).toBe(false);
    expect(isWithinCeiling('ESCALATE', 'ACT')).toBe(false);
    expect(isWithinCeiling('ACT', 'MERGE')).toBe(false);
    expect(isWithinCeiling('WAIT', 'MERGE')).toBe(false);
  });
});
