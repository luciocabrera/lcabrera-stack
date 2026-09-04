/*
 * Both of these parsers decide what window a printed count belongs to, so the
 * failures worth pinning are the quiet ones: a flag whose value was actually the
 * next flag, a `cleanupPeriodDays` that is not a number of days, and a horizon
 * that narrows the transcript read when no expiry is being simulated.
 */
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import {
  DOCUMENTED_CLEANUP_DEFAULT,
  parseArgs,
  positiveInteger,
  resolveRetention,
  transcriptHorizon,
} from './usage-args.mjs';

const WINDOW = { days: 90, end: '2026-09-04', start: '2026-06-07' };

const repoWith = (settings) => {
  const root = mkdtempSync(join(tmpdir(), 'usage-args-'));
  mkdirSync(join(root, '.claude'));
  writeFileSync(join(root, '.claude', 'settings.json'), settings);
  return root;
};

describe('parseArgs', () => {
  it('reads a flag and its value', () => {
    expect(parseArgs(['--days', '30', '--out', 'reports/usage'])).toEqual({
      days: '30',
      out: 'reports/usage',
    });
  });

  it('refuses to swallow the next flag as a value', () => {
    expect(() => parseArgs(['--days', '--out', 'reports/usage'])).toThrow(
      '--days needs a value',
    );
  });

  it('refuses a trailing flag with no value at all', () => {
    expect(() => parseArgs(['--snapshot'])).toThrow('--snapshot needs a value');
  });

  it('rejects an unknown flag', () => {
    expect(() => parseArgs(['--weeks', '3'])).toThrow('unknown argument');
  });
});

describe('positiveInteger', () => {
  it('rejects a value that only starts with digits', () => {
    expect(() => positiveInteger('30d', '--days')).toThrow(
      'positive whole number of days',
    );
  });

  it('rejects zero and anything below it', () => {
    expect(() => positiveInteger('0', '--days')).toThrow(
      'positive whole number of days',
    );
  });
});

describe('resolveRetention', () => {
  it('reads cleanupPeriodDays when it is a whole number of days', () => {
    const repoRoot = repoWith('{ "cleanupPeriodDays": 45 }');

    expect(resolveRetention({ args: {}, repoRoot })).toEqual({
      days: 45,
      simulated: false,
    });
  });

  it('falls back to the documented default when the key is unset', () => {
    const repoRoot = repoWith('{}');

    expect(resolveRetention({ args: {}, repoRoot }).days).toBe(
      DOCUMENTED_CLEANUP_DEFAULT,
    );
  });

  it('refuses a cleanupPeriodDays that is not a number of days', () => {
    for (const value of ['0', '-5', '2.5', '"30"', 'null']) {
      expect(() =>
        resolveRetention({
          args: {},
          repoRoot: repoWith(`{ "cleanupPeriodDays": ${value} }`),
        }),
      ).toThrow('must be a positive whole number of days');
    }
  });

  it('refuses settings that are not readable JSON', () => {
    expect(() =>
      resolveRetention({ args: {}, repoRoot: repoWith('{ oops') }),
    ).toThrow('not readable JSON');
  });

  it('marks a flagged retention as simulated', () => {
    expect(
      resolveRetention({
        args: { retentionDays: '1' },
        repoRoot: repoWith('{}'),
      }),
    ).toEqual({ days: 1, simulated: true });
  });
});

describe('transcriptHorizon', () => {
  it('reads every transcript on disk when no expiry is being simulated', () => {
    expect(
      transcriptHorizon({
        retention: { days: 30, simulated: false },
        window: WINDOW,
      }),
    ).toBeUndefined();
  });

  it('narrows to the simulated horizon only when one was asked for', () => {
    expect(
      transcriptHorizon({
        retention: { days: 2, simulated: true },
        window: WINDOW,
      }),
    ).toBe('2026-09-03');
  });
});
