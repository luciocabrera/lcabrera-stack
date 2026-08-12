import { describe, expect, it } from 'vite-plus/test';

import { TABLE_AGGREGATE_FNS } from '../Table.constants';
import { orderLegalAggregates } from './orderLegalAggregates.util';

describe('orderLegalAggregates', () => {
  it('offers only what the catalogue said is legal', () => {
    // The whole point of criterion 2: a menu shaped from the column's declared
    // dataType would offer `sum` on a numeric it reads as a string, and hide it
    // on the one it does not (#550).
    expect(orderLegalAggregates({ legal: ['count', 'sum'] })).toStrictEqual([
      'count',
      'sum',
    ]);
  });

  it('offers nothing when the catalogue offered nothing', () => {
    expect(orderLegalAggregates({ legal: [] })).toStrictEqual([]);
  });

  it('re-orders the alphabetical answer into menu order', () => {
    // `getColumnGroupingCapabilities` returns SQL-name order, which puts `avg`
    // before `count`. A menu reads better the other way round.
    expect(
      orderLegalAggregates({
        legal: ['avg', 'count', 'countDistinct', 'max', 'min', 'sum'],
      }),
    ).toStrictEqual(['count', 'countDistinct', 'sum', 'avg', 'min', 'max']);
  });

  it('drops a name this package does not know', () => {
    const legal = ['count', 'median'] as unknown as readonly ['count'];

    expect(orderLegalAggregates({ legal })).toStrictEqual(['count']);
  });

  it('never offers a function twice', () => {
    const offered = orderLegalAggregates({ legal: TABLE_AGGREGATE_FNS });

    expect(offered).toHaveLength(new Set(offered).size);
  });
});
