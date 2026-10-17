import { describe, expect, it } from 'vite-plus/test';

import { costCoverageLabel } from './costCoverageLabel.util';

const base = { missing: 'no model price', verb: 'priced' };

describe('costCoverageLabel', () => {
  it('gives the cost when every trial carries one', () => {
    expect(
      costCoverageLabel({ ...base, covered: 4, trials: 4, usd: 1.25 }),
    ).toBe('$1.25');
  });

  it('says how many trials a partial cost covers', () => {
    expect(
      costCoverageLabel({ ...base, covered: 3, trials: 4, usd: 1.25 }),
    ).toBe('$1.25 (3 of 4 trials priced)');
  });

  it('says why there is no cost at all', () => {
    expect(
      costCoverageLabel({ ...base, covered: 0, trials: 4, usd: undefined }),
    ).toBe('no model price');
  });
});
