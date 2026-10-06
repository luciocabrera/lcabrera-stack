import { describe, expect, it } from 'vite-plus/test';

import type { TriggerTrial } from './stats.types.ts';

import { triggerPrecisionRecall } from './triggerPrecisionRecall.util.ts';

const config = { minTrialsForRate: 2, z: 1.96 };

const hit: TriggerTrial = {
  expected: ['react'],
  invoked: ['react'],
  outcome: 'pass',
};
const miss: TriggerTrial = {
  expected: ['react'],
  invoked: [],
  outcome: 'fail',
};
const stray: TriggerTrial = {
  expected: [],
  invoked: ['react'],
  outcome: 'fail',
};

describe('triggerPrecisionRecall', () => {
  it('returns per-skill precision and recall as rates with n and an interval', () => {
    const [react] = triggerPrecisionRecall({
      config,
      trials: [hit, hit, miss, stray],
    });

    expect(react?.skill).toBe('react');
    expect(react?.recall).toMatchObject({ k: 2, kind: 'rate', n: 3 });
    expect(react?.precision).toMatchObject({ k: 2, kind: 'rate', n: 3 });
    expect(react?.recall.kind === 'rate' && react.recall.lower).toBeGreaterThan(
      0,
    );
    expect(react?.recall.kind === 'rate' && react.recall.upper).toBeLessThan(1);
  });

  it('counts a trial that loaded two skills toward both', () => {
    const result = triggerPrecisionRecall({
      config,
      trials: [
        { expected: ['react'], invoked: ['react', 'router'], outcome: 'pass' },
        { expected: ['router'], invoked: ['router'], outcome: 'pass' },
      ],
    });

    expect(result.map(({ precision, skill }) => [skill, precision])).toEqual([
      ['react', { k: 1, kind: 'insufficient', n: 1 }],
      ['router', expect.objectContaining({ k: 1, kind: 'rate', n: 2 })],
    ]);
  });

  it('leaves errors, timeouts and skips out of both counts', () => {
    const [react] = triggerPrecisionRecall({
      config,
      trials: [
        hit,
        hit,
        { ...miss, outcome: 'error' },
        { ...stray, outcome: 'timeout' },
        { ...stray, outcome: 'skipped' },
      ],
    });

    expect(react?.recall).toMatchObject({ k: 2, n: 2 });
    expect(react?.precision).toMatchObject({ k: 2, n: 2 });
  });

  it('returns insufficient below the trial floor', () => {
    const [react] = triggerPrecisionRecall({
      config: { minTrialsForRate: 6, z: 1.96 },
      trials: [hit],
    });

    expect(react?.recall).toEqual({ k: 1, kind: 'insufficient', n: 1 });
  });
});
