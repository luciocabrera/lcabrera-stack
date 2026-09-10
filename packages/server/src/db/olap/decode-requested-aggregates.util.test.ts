import { describe, expect, it } from 'vite-plus/test';

import { decodeRequestedAggregates } from './decode-requested-aggregates.util';

describe('decodeRequestedAggregates', () => {
  it('pairs each requested measure with the emitted alias at that position', () => {
    expect(
      decodeRequestedAggregates({
        requested: [{ column: 'amount', fn: 'sum' }],
        selected: [{ alias: 'sum_amount', column: 'amount', fn: 'sum' }],
      }),
    ).toStrictEqual([{ alias: 'sum_amount', columnKey: 'amount', fn: 'sum' }]);
  });

  it('throws when the lists do not line up', () => {
    expect(() =>
      decodeRequestedAggregates({
        requested: [{ column: 'amount', fn: 'sum' }],
        selected: [],
      }),
    ).toThrow(/aggregate alias/);
  });
});
