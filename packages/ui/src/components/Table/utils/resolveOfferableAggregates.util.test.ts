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
    // The catalogue answers as a set sorted by SQL name; a menu needs count
    // first, arithmetic next.
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
    // Absent means "no aggregate is legal here", never "all of them are".
    expect(
      resolveOfferableAggregates({ capability: undefined, isGroupKey: false }),
    ).toStrictEqual([]);
  });

  it('offers nothing while the column is a group key, whatever its type says', () => {
    // The discriminating half: the same capability that yields three functions
    // above yields none here, so the group-key condition is doing the work and
    // not the type legality (#830, ADR-080).
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
