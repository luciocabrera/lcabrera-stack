import { describe, expect, it } from 'vite-plus/test';

import { resolveDistinctEstimate } from './resolve-distinct-estimate.util.ts';

describe('resolveDistinctEstimate', () => {
  it('takes a positive n_distinct as the count itself', () => {
    expect(
      resolveDistinctEstimate({
        hasStats: true,
        nDistinct: 7,
        relTuples: 2000,
      }),
    ).toEqual({ kind: 'known', value: 7 });
  });

  it('multiplies a negative n_distinct out against the row count', () => {
    expect(
      resolveDistinctEstimate({
        hasStats: true,
        nDistinct: -0.25,
        relTuples: 2000,
      }),
    ).toEqual({ kind: 'known', value: 500 });
  });

  it('resolves n_distinct = -1 to every row being distinct', () => {
    expect(
      resolveDistinctEstimate({
        hasStats: true,
        nDistinct: -1,
        relTuples: 2000,
      }),
    ).toEqual({ kind: 'known', value: 2000 });
  });

  it('reports a missing pg_stats row as unknown, not as zero', () => {
    expect(
      resolveDistinctEstimate({
        hasStats: false,
        nDistinct: 0,
        relTuples: 2000,
      }),
    ).toEqual({ kind: 'unknown' });
  });

  it('reports an unvacuumed relation as unknown', () => {
    expect(
      resolveDistinctEstimate({ hasStats: true, nDistinct: 7, relTuples: -1 }),
    ).toEqual({ kind: 'unknown' });
  });

  // The distinction ADR-058 turns on: both cases have "no usable number", and
  // conflating them is what points the safety valve at the unsafe branch.
  it('keeps undefined distinctness apart from unavailable statistics', () => {
    const undefinedDistinctness = resolveDistinctEstimate({
      hasStats: true,
      nDistinct: 0,
      relTuples: 2000,
    });
    // Both rows carry the same zero — the query coalesces the absent case — so
    // `hasStats` is the only thing telling them apart.
    const unavailable = resolveDistinctEstimate({
      hasStats: false,
      nDistinct: 0,
      relTuples: 2000,
    });

    expect(undefinedDistinctness).toEqual({ kind: 'undefinedDistinctness' });
    expect(unavailable).toEqual({ kind: 'unknown' });
    expect(undefinedDistinctness).not.toEqual(unavailable);
  });

  it('still reads a zero on an empty relation as undefined distinctness', () => {
    expect(
      resolveDistinctEstimate({ hasStats: true, nDistinct: 0, relTuples: 0 }),
    ).toEqual({ kind: 'undefinedDistinctness' });
  });
});
