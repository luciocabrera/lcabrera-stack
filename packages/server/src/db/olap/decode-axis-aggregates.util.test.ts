import { describe, expect, it } from 'vite-plus/test';

import { decodeAxisAggregates } from './decode-axis-aggregates.util';

describe('decodeAxisAggregates', () => {
  it('carries alias and axis for each expanded measure', () => {
    expect(
      decodeAxisAggregates({
        requested: [{ column: 'amount', fn: 'sum' }],
        selected: [
          {
            alias: 'sum_amount_c0',
            axis: { value: 'Pending' },
            column: 'amount',
            fn: 'sum',
          },
        ],
      }),
    ).toStrictEqual([
      {
        alias: 'sum_amount_c0',
        axis: { value: 'Pending' },
        columnKey: 'amount',
        fn: 'sum',
      },
    ]);
  });

  it('drops an expanded count(*) that was not requested as a measure', () => {
    expect(
      decodeAxisAggregates({
        requested: [{ column: 'amount', fn: 'sum' }],
        selected: [
          { alias: 'count_rows_c0', axis: { value: 'Pending' }, fn: 'count' },
          {
            alias: 'sum_amount_c0',
            axis: { value: 'Pending' },
            column: 'amount',
            fn: 'sum',
          },
        ],
      }),
    ).toHaveLength(1);
  });
});
