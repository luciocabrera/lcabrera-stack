/**
 * The gate is the operator's leash, so these tests pin the direction it fails
 * in: every uncertainty must resolve toward ESCALATE, never toward MERGE. The
 * ceiling test is the important one — it is what stops a model reasoning its way
 * past a hard stop.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { extractImportSpecifiers } from '../../packages/devkit/scripts/closure-extract.mjs';
import { publicPackageDirs } from './coverage-workspaces.mjs';
import {
  detectBlockers,
  detectFlags,
  detectStops,
  evaluateGate,
  isWithinCeiling,
  OPERATOR_FILES,
} from './pr-queue-gate.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const ROSTER = publicPackageDirs(REPO_ROOT);

const OPERATOR_ENTRY = 'scripts/pr-queue-operator.mjs';

const repoRelative = (fromFile, specifier) =>
  relative(REPO_ROOT, resolve(dirname(join(REPO_ROOT, fromFile)), specifier))
    .split('\\')
    .join('/');

const importClosure = (entry) => {
  const seen = new Set();
  const pending = [entry];
  while (pending.length > 0) {
    const current = pending.pop();
    if (seen.has(current)) continue;
    seen.add(current);
    const full = join(REPO_ROOT, current);
    if (!existsSync(full)) continue;
    for (const { specifier } of extractImportSpecifiers(
      readFileSync(full, 'utf8'),
    )) {
      if (specifier.startsWith('.'))
        pending.push(repoRelative(current, specifier));
    }
  }
  return [...seen].sort((left, right) => left.localeCompare(right));
};

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

  it('S9 covers every file the operator imports', () => {
    const closure = importClosure(OPERATOR_ENTRY);
    expect(closure).toContain(OPERATOR_ENTRY);
    expect(closure.length).toBeGreaterThan(1);
    expect(closure.filter((path) => !OPERATOR_FILES.has(path))).toEqual([]);
  });

  it('lists nothing in S9 the operator does not open by name', () => {
    const entry = readFileSync(join(REPO_ROOT, OPERATOR_ENTRY), 'utf8');
    const closure = importClosure(OPERATOR_ENTRY);
    const beyondClosure = [...OPERATOR_FILES].filter(
      (path) => !closure.includes(path),
    );
    expect(beyondClosure.length).toBeGreaterThan(0);
    for (const path of beyondClosure) {
      expect(existsSync(join(REPO_ROOT, path))).toBe(true);
      expect(
        entry.includes(`'${path}'`) || entry.includes(`"${path}"`),
        `${path} is in OPERATOR_FILES but ${OPERATOR_ENTRY} never names it`,
      ).toBe(true);
    }
  });

  it.each([...OPERATOR_FILES])('stops a PR touching %s (S9)', (path) => {
    expect(detectStops(pr({ files: [file(path)] })).map((s) => s.id)).toContain(
      'S9',
    );
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
