import { describe, expect, it } from 'vite-plus/test';

import { TABLE_GROUP_ROW_FIELD } from '../Table.constants';
import { collectColumnAxisEmitted } from './collectColumnAxisEmitted.util';

describe('collectColumnAxisEmitted', () => {
  it('returns nothing when no group row is loaded', () => {
    expect(
      collectColumnAxisEmitted([{ order_id: 1, order_status: 'Pending' }]),
    ).toStrictEqual([]);
  });

  it('reads alias and axis off the first group row', () => {
    expect(
      collectColumnAxisEmitted([
        {
          [TABLE_GROUP_ROW_FIELD]: {
            aggregates: [
              {
                alias: 'sum_total_amount_c0',
                axis: { value: 'Pending' },
                columnKey: 'total_amount',
                fn: 'sum',
                value: 10,
              },
              {
                alias: 'sum_total_amount_c1',
                axis: { value: undefined },
                columnKey: 'total_amount',
                fn: 'sum',
                value: 3,
              },
            ],
            count: 4,
            isSubtotal: false,
            path: [],
          },
        },
      ]),
    ).toStrictEqual([
      {
        alias: 'sum_total_amount_c0',
        axis: { value: 'Pending' },
        columnKey: 'total_amount',
        fn: 'sum',
      },
      {
        alias: 'sum_total_amount_c1',
        axis: { value: undefined },
        columnKey: 'total_amount',
        fn: 'sum',
      },
    ]);
  });
});
