import { describe, expect, it } from 'vite-plus/test';

import type { RegressionConfig } from './stats.types.ts';

import { scoredRegression } from './scoredRegression.util.ts';
import { summarize } from './summarize.util.ts';

type CompareArgs = {
  readonly scores: readonly number[];
  readonly sigma?: number;
};

const config: RegressionConfig = {
  baseline: { defaultRuns: 5 },
  binary: { flip: { failAtLeast: 2, ofTrials: 3 } },
  flaky: { disagreeFraction: 0.2, window: 10 },
  minTrialsForRate: 6,
  scored: { sigma: 2 },
  z: 1.96,
};
const identity = { harnessVersion: 'aaaaaaaaaaaa', modelId: 'model-a' };
const baseline = { identity, summary: summarize([0.8, 0.9, 0.8, 0.9]) };

const compare = ({ scores, sigma = 2 }: CompareArgs) =>
  scoredRegression({
    baseline,
    config: { ...config, scored: { sigma } },
    pr: { identity, scores },
  });

describe('scoredRegression', () => {
  it('flags a PR mean more than sigma standard deviations below the baseline mean', () => {
    const result = compare({ scores: [0.6, 0.65] });

    expect(result.kind).toBe('regression');
    expect(result.kind === 'regression' && result.findings[0]).toMatchObject({
      kind: 'mean',
      mean: 0.625,
    });
  });

  it('does not flag a drop inside the band', () => {
    expect(compare({ scores: [0.75, 0.8] })).toEqual({ kind: 'clear' });
  });

  it('moves with the configured sigma', () => {
    expect(compare({ scores: [0.75, 0.75], sigma: 0.5 }).kind).toBe(
      'regression',
    );
  });

  it('refuses a baseline of fewer than two runs, and a PR with no scores', () => {
    expect(
      scoredRegression({
        baseline: { identity, summary: summarize([0.9]) },
        config,
        pr: { identity, scores: [0.1] },
      }),
    ).toEqual({ kind: 'insufficient' });
    expect(compare({ scores: [] })).toEqual({ kind: 'insufficient' });
  });

  it('refuses a comparison across models', () => {
    expect(
      scoredRegression({
        baseline,
        config,
        pr: { identity: { ...identity, modelId: 'model-b' }, scores: [0.1] },
      }),
    ).toEqual({ kind: 'incomparable', reason: 'model-changed' });
  });
});
