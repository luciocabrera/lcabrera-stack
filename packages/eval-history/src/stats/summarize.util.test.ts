import { describe, expect, it } from 'vite-plus/test';

import { summarize } from './summarize.util.ts';

describe('summarize', () => {
  it('returns the mean and the sample standard deviation', () => {
    const result = summarize([2, 4, 4, 4, 5, 5, 7, 9]);

    expect(result.kind).toBe('summary');
    expect(result.kind === 'summary' && result.mean).toBe(5);
    expect(result.kind === 'summary' && result.stddev).toBeCloseTo(
      Math.sqrt(32 / 7),
      12,
    );
    expect(result.n).toBe(8);
  });

  it('refuses fewer than two values', () => {
    expect(summarize([0.8])).toEqual({ kind: 'insufficient', n: 1 });
    expect(summarize([])).toEqual({ kind: 'insufficient', n: 0 });
  });
});
