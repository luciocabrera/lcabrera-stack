import { describe, expect, it } from 'vite-plus/test';

import { TABLE_AGGREGATE_FNS } from '../Table.constants';
import { orderLegalAggregates } from './orderLegalAggregates.util';

describe('orderLegalAggregates', () => {
  it('offers only what the catalogue said is legal', () => {
    expect(orderLegalAggregates({ legal: ['count', 'sum'] })).toStrictEqual([
      'count',
      'sum',
    ]);
  });

  it('offers nothing when the catalogue offered nothing', () => {
    expect(orderLegalAggregates({ legal: [] })).toStrictEqual([]);
  });

  it('re-orders the alphabetical answer into menu order', () => {
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
