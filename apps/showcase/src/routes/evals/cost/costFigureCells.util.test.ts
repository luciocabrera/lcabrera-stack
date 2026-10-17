import { describe, expect, it } from 'vite-plus/test';

import { costFigureCells } from './costFigureCells.util';

const FIGURES = {
  computedTrials: 4,
  computedUsd: 0.5,
  costliestTrialId: '1',
  p50Ms: 1500,
  p95Ms: 64_000,
  reportedTrials: 2,
  reportedUsd: 0.25,
  slowestTrialId: '2',
  tokensCacheRead: 100,
  tokensCacheWrite: 20,
  tokensIn: 12_000,
  tokensOut: 3400,
  trials: 4,
};

describe('costFigureCells', () => {
  it('keeps the reported and the computed cost in their own cells', () => {
    expect(costFigureCells(FIGURES)).toMatchObject({
      computed: '$0.50',
      reported: '$0.25 (2 of 4 trials reported)',
    });
  });

  it('says which cost is missing and why', () => {
    expect(
      costFigureCells({
        ...FIGURES,
        computedTrials: 0,
        computedUsd: undefined,
        reportedTrials: 0,
        reportedUsd: undefined,
      }),
    ).toMatchObject({
      computed: 'no model price',
      reported: 'not reported',
    });
  });

  it('formats the tokens and the duration percentiles', () => {
    expect(costFigureCells(FIGURES)).toMatchObject({
      p50: '2s',
      p95: '1m 4s',
      tokensCache: '100 read, 20 written',
      tokensIn: '12,000',
      trials: '4',
    });
  });
});
