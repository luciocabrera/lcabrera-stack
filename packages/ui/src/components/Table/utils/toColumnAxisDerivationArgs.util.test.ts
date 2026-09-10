import { describe, expect, it } from 'vite-plus/test';

import { TABLE_GROUP_ROW_FIELD } from '../Table.constants';
import { toColumnAxisDerivationArgs } from './toColumnAxisDerivationArgs.util';

describe('toColumnAxisDerivationArgs', () => {
  it('omits the axis when none is set', () => {
    expect(toColumnAxisDerivationArgs({})).toStrictEqual({});
  });

  it('emits no measure columns until the wide result arrives', () => {
    expect(
      toColumnAxisDerivationArgs({ columnAxis: 'order_status' }),
    ).toStrictEqual({
      columnAxis: 'order_status',
      columnAxisEmitted: [],
    });
  });

  it('reads aliases off the first group row', () => {
    expect(
      toColumnAxisDerivationArgs({
        columnAxis: 'order_status',
        data: [
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
              ],
              count: 1,
              isSubtotal: false,
              path: [],
            },
          },
        ],
      }).columnAxisEmitted,
    ).toStrictEqual([
      {
        alias: 'sum_total_amount_c0',
        axis: { value: 'Pending' },
        columnKey: 'total_amount',
        fn: 'sum',
      },
    ]);
  });
});
