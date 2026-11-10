import { describe, expect, it } from 'vite-plus/test';

import { VERDICTS } from './adjudications.fixtures';
import { modelCosts } from './modelCosts.util';

describe('modelCosts', () => {
  it("totals each model's reported cost, mean time and tokens over its seats", () => {
    expect(modelCosts(VERDICTS)).toEqual([
      {
        cases: 4,
        cost: '$3.00',
        costPerVerdict: '$1.00',
        duration: '1m 30s',
        id: 'claude-fable-5-1',
        model: 'claude-fable-5-1',
        tokensIn: 4000,
        tokensOut: 8000,
        verdicts: 4,
      },
      {
        cases: 4,
        cost: '$0.40',
        costPerVerdict: '$0.10',
        duration: '30s',
        id: 'claude-opus-5-5',
        model: 'claude-opus-5-5',
        tokensIn: 4000,
        tokensOut: 8000,
        verdicts: 4,
      },
      {
        cases: 4,
        cost: '$0.40',
        costPerVerdict: '$0.10',
        duration: '20s',
        id: 'claude-sonnet-5-5',
        model: 'claude-sonnet-5-5',
        tokensIn: 4000,
        tokensOut: 8000,
        verdicts: 4,
      },
    ]);
  });

  it('says the cost was not reported when no seat of a model reported one', () => {
    const [first] = VERDICTS;
    const unpriced =
      first === undefined ? [] : [{ ...first, costUsd: undefined }];

    expect(modelCosts(unpriced)).toMatchObject([
      { cost: 'not reported', costPerVerdict: 'not reported', verdicts: 1 },
    ]);
  });
});
