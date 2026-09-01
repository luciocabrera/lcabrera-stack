import { describe, expect, it } from 'vite-plus/test';

import type { TableColumnGroupingCapability } from '../Table.types';

import { resolveOfferableAggregates } from './resolveOfferableAggregates.util';

const numericCapability: TableColumnGroupingCapability = {
  aggregates: ['sum', 'count', 'avg'],
  canGroup: false,
  column: 'total_amount',
  periods: [],
  refusal: 'too-many-distinct',
  role: 'fact',
  typeName: 'numeric',
};

const unsupportedCapability: TableColumnGroupingCapability = {
  aggregates: [],
  canGroup: false,
  column: 'doc',
  periods: [],
  refusal: 'not-a-dimension',
  role: 'unsupported',
  typeName: 'jsonb',
};

describe('resolveOfferableAggregates', () => {
  it('offers what the catalogue reported, in menu order', () => {
    expect(
      resolveOfferableAggregates({
        capability: numericCapability,
        isGroupKey: false,
      }),
    ).toStrictEqual(['count', 'sum', 'avg']);
  });

  it('offers nothing for a column the catalogue can aggregate in no way', () => {
    expect(
      resolveOfferableAggregates({
        capability: unsupportedCapability,
        isGroupKey: false,
      }),
    ).toStrictEqual([]);
  });

  it('offers nothing when no capability was resolved for the column', () => {
    expect(
      resolveOfferableAggregates({ capability: undefined, isGroupKey: false }),
    ).toStrictEqual([]);
  });

  it('offers nothing while the column is a group key, whatever its type says', () => {
    expect(
      resolveOfferableAggregates({
        capability: numericCapability,
        isGroupKey: true,
      }),
    ).toStrictEqual([]);
  });

  it('offers the column again once it stops being a group key', () => {
    expect(
      resolveOfferableAggregates({
        capability: numericCapability,
        isGroupKey: false,
      }),
    ).not.toStrictEqual([]);
  });
});
