import { describe, expect, it } from 'vite-plus/test';

import type { TableColumnGroupingCapability } from '../Table.types';

import { resolveAffordableAggregates } from './resolveAffordableAggregates.util';

const textCapability: TableColumnGroupingCapability = {
  aggregates: ['count', 'countDistinct', 'max', 'min'],
  canGroup: true,
  column: 'order_status',
  periods: [],
  role: 'dimension',
  typeName: 'text',
};

const numericCapability: TableColumnGroupingCapability = {
  aggregates: ['avg', 'count', 'sum'],
  canGroup: false,
  column: 'total_amount',
  periods: [],
  refusal: 'too-many-distinct',
  role: 'fact',
  typeName: 'numeric',
};

describe('resolveAffordableAggregates', () => {
  it('passes the offerable set through while the budget is unspent', () => {
    expect(
      resolveAffordableAggregates({
        applied: [{ columnKey: 'total_amount', fn: 'sum' }],
        capability: textCapability,
        columnKey: 'order_status',
        isGroupKey: false,
      }),
    ).toStrictEqual({
      affordable: ['count', 'countDistinct', 'min', 'max'],
      withheld: [],
    });
  });

  it('withholds a second countDistinct from another column', () => {
    expect(
      resolveAffordableAggregates({
        applied: [{ columnKey: 'shipped_city', fn: 'countDistinct' }],
        capability: textCapability,
        columnKey: 'order_status',
        isGroupKey: false,
      }),
    ).toStrictEqual({
      affordable: ['count', 'min', 'max'],
      withheld: ['countDistinct'],
    });
  });

  it('keeps offering it on the column that carries it', () => {
    expect(
      resolveAffordableAggregates({
        applied: [{ columnKey: 'order_status', fn: 'countDistinct' }],
        capability: textCapability,
        columnKey: 'order_status',
        isGroupKey: false,
      }),
    ).toStrictEqual({
      affordable: ['count', 'countDistinct', 'min', 'max'],
      withheld: [],
    });
  });

  it('offers it again everywhere once it is cleared', () => {
    expect(
      resolveAffordableAggregates({
        applied: [{ columnKey: 'shipped_city', fn: 'count' }],
        capability: textCapability,
        columnKey: 'order_status',
        isGroupKey: false,
      }).affordable,
    ).toStrictEqual(['count', 'countDistinct', 'min', 'max']);
  });

  it('withholds nothing from a column the catalogue never offered it on', () => {
    expect(
      resolveAffordableAggregates({
        applied: [{ columnKey: 'shipped_city', fn: 'countDistinct' }],
        capability: numericCapability,
        columnKey: 'total_amount',
        isGroupKey: false,
      }),
    ).toStrictEqual({ affordable: ['count', 'sum', 'avg'], withheld: [] });
  });

  it('leaves the per-column predicate to answer first', () => {
    expect(
      resolveAffordableAggregates({
        applied: [],
        capability: textCapability,
        columnKey: 'order_status',
        isGroupKey: true,
      }),
    ).toStrictEqual({ affordable: [], withheld: [] });
  });

  it('counts every other column, not only the last one', () => {
    expect(
      resolveAffordableAggregates({
        applied: [
          { columnKey: 'shipped_city', fn: 'countDistinct' },
          { columnKey: 'total_amount', fn: 'sum' },
          { columnKey: 'total_amount', fn: 'avg' },
        ],
        capability: textCapability,
        columnKey: 'order_status',
        isGroupKey: false,
      }).withheld,
    ).toStrictEqual(['countDistinct']);
  });
});
