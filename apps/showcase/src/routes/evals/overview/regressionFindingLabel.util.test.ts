import { describe, expect, it } from 'vite-plus/test';

import { regressionFindingLabel } from './regressionFindingLabel.util';

type RateArgs = {
  readonly k: number;
  readonly lower: number;
  readonly n: number;
};

const rate = ({ k, lower, n }: RateArgs) =>
  ({ k, kind: 'rate', lower, n, rate: k / n, upper: 1 }) as const;

describe('regressionFindingLabel', () => {
  it('names a flipped task with its failed trials', () => {
    expect(
      regressionFindingLabel({
        failed: 2,
        kind: 'flip',
        taskKey: 'skills/react-19/trigger-1',
        trials: 3,
      }),
    ).toBe(
      'skills/react-19/trigger-1 failed 2 of 3 trials after passing every trial the run before',
    );
  });

  it('puts a pass rate against the lower bound of the run before', () => {
    expect(
      regressionFindingLabel({
        kind: 'rate',
        main: rate({ k: 9, lower: 0.6, n: 10 }),
        pr: rate({ k: 3, lower: 0.1, n: 10 }),
      }),
    ).toBe(
      'pass rate 30% (3/10) over its non-flaky regression tasks, below 60%, the lower bound of the run before at 90% (9/10)',
    );
  });

  it('says when a side has too few trials for a rate', () => {
    expect(
      regressionFindingLabel({
        kind: 'rate',
        main: { k: 1, kind: 'insufficient', n: 2 },
        pr: { k: 0, kind: 'insufficient', n: 2 },
      }),
    ).toBe(
      'pass rate 0/2, too few trials for a rate over its non-flaky regression tasks, below the run before',
    );
  });

  it('puts a mean score against its threshold', () => {
    expect(
      regressionFindingLabel({ kind: 'mean', mean: 3.2, threshold: 3.5 }),
    ).toBe('mean score 3.20 fell below 3.50');
  });
});
