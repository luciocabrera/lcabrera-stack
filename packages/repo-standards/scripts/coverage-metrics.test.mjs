import { describe, expect, it } from 'vite-plus/test';

import { normaliseMetric, percentageOf } from './coverage-metrics.mjs';

describe('percentageOf', () => {
  it('reads an empty total as complete, the rule the aggregate already uses', () => {
    expect(percentageOf({ covered: 0, total: 0 })).toBe(100);
  });

  it('is the ordinary ratio otherwise', () => {
    expect(percentageOf({ covered: 3, total: 4 })).toBe(75);
  });
});

describe('normaliseMetric', () => {
  it('keeps a percentage the reporter already computed', () => {
    expect(
      normaliseMetric({ covered: 3, pct: 75, skipped: 0, total: 4 }),
    ).toEqual({ covered: 3, pct: 75, skipped: 0, total: 4 });
  });

  it('replaces the string istanbul writes for an empty total', () => {
    expect(
      normaliseMetric({ covered: 0, pct: 'Unknown', skipped: 0, total: 0 }),
    ).toEqual({ covered: 0, pct: 100, skipped: 0, total: 0 });
  });

  it('answers a number for every input, since every consumer calls toFixed', () => {
    for (const metric of [
      undefined,
      {},
      { pct: null },
      { pct: Number.NaN, total: 0 },
      { covered: 1, pct: 'Unknown', total: 2 },
    ]) {
      expect(typeof normaliseMetric(metric).pct).toBe('number');
      expect(Number.isFinite(normaliseMetric(metric).pct)).toBe(true);
    }
  });
});
