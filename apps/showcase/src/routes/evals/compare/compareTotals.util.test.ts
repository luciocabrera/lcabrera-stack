import { describe, expect, it } from 'vite-plus/test';

import type { RunFigures } from '../types/runFigures.types';

import { rateFigures } from '../utils/rateFigures.util';
import { compareTotals } from './compareTotals.util';

const run = (overrides: Partial<RunFigures>) =>
  ({
    costUsd: 1,
    durationMs: 60_000,
    k: 9,
    lower: 0.6,
    n: 10,
    rate: 0.9,
    trials: 10,
    upper: 0.98,
    ...overrides,
  }) as RunFigures;

describe('compareTotals', () => {
  it('sets each total of A beside B with the change between them', () => {
    const totals = compareTotals({
      a: run({}),
      b: run({ costUsd: 1.5, k: 5, lower: 0.2, rate: 0.5, upper: 0.55 }),
    });

    expect(totals.map(({ change, metric }) => [metric, change])).toEqual([
      ['Pass rate', '-40 pts'],
      ['Interval', 'B is below A'],
      ['Trials', 'no change'],
      ['Cost (Reported by the SDK)', '+$0.50'],
      ['Duration', 'no change'],
    ]);
  });

  it('cannot compare a cost one run did not report', () => {
    const cost = compareTotals({
      a: run({ costUsd: undefined }),
      b: run({}),
    }).find(({ metric }) => metric.startsWith('Cost'));

    expect(cost).toMatchObject({ a: 'not reported', change: 'not comparable' });
  });

  it.each([
    { a: { k: 20, n: 20 }, b: { k: 0, n: 20 }, change: 'B is below A' },
    { a: { k: 0, n: 20 }, b: { k: 20, n: 20 }, change: 'B is above A' },
    { a: { k: 10, n: 20 }, b: { k: 11, n: 20 }, change: 'overlapping' },
    {
      a: { k: 10, n: 20 },
      b: { k: 2, n: 3 },
      change: 'too few trials to compare',
    },
  ])(
    'reads the interval of A $a.k/$a.n against B $b.k/$b.n as "$change"',
    ({ a, b, change }) => {
      const interval = compareTotals({
        a: run(rateFigures(a)),
        b: run(rateFigures(b)),
      }).find(({ metric }) => metric === 'Interval');

      expect(interval?.change).toBe(change);
    },
  );
});
