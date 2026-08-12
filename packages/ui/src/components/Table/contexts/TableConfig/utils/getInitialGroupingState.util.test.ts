import { describe, expect, it } from 'vite-plus/test';

import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';

import { getInitialGroupingState } from './getInitialGroupingState.util';

const NO_GROUPING = { aggregates: {}, keys: [] };

const keysOfLength = (length: number) =>
  Array.from({ length }, (_unused, index) => `key_${index}`);

describe('getInitialGroupingState', () => {
  it('seeds the keys the loader applied', () => {
    expect(
      getInitialGroupingState({ groupingKeys: ['order_status'] }),
    ).toStrictEqual({ aggregates: {}, keys: ['order_status'] });
  });

  it('seeds the aggregates the loader applied', () => {
    expect(
      getInitialGroupingState({
        groupingAggregates: { total_amount: 'sum' },
        groupingKeys: ['order_status'],
      }),
    ).toStrictEqual({
      aggregates: { total_amount: 'sum' },
      keys: ['order_status'],
    });
  });

  it('defaults to no grouping when the loader supplied none', () => {
    expect(getInitialGroupingState({})).toStrictEqual({
      aggregates: {},
      keys: [],
    });
  });

  it('copies the loader state rather than aliasing it', () => {
    const groupingAggregates = { total_amount: 'sum' } as const;
    const groupingKeys = ['order_status'];
    const state = getInitialGroupingState({ groupingAggregates, groupingKeys });

    expect(state.keys).not.toBe(groupingKeys);
    expect(state.keys).toStrictEqual(groupingKeys);
    expect(state.aggregates).not.toBe(groupingAggregates);
    expect(state.aggregates).toStrictEqual(groupingAggregates);
  });

  // Seeding the store is a write path like any other, and it is the one a
  // consumer outside this repo reaches: `createTableRouteLoader` sanitizes
  // before it gets here, but `@lcabrera/ui` is published and a hand-written
  // loader is the intended use. Without the guard such a route seeds a store
  // the package renders as grouped and the query then throws at
  // `assertGroupKeys` — a 500 out of a state the package itself accepted.
  describe('depth cap', () => {
    it('seeds exactly the cap', () => {
      const groupingKeys = keysOfLength(MAX_TABLE_GROUP_KEYS);

      expect(getInitialGroupingState({ groupingKeys }).keys).toStrictEqual(
        groupingKeys,
      );
    });

    it('refuses one key past the cap, whole rather than truncated', () => {
      // Truncating to the cap would group by a prefix of what was asked for and
      // answer a different question in silence — keys are ordered, and the
      // order is the query's nesting order.
      const groupingKeys = keysOfLength(MAX_TABLE_GROUP_KEYS + 1);

      expect(getInitialGroupingState({ groupingKeys })).toStrictEqual(
        NO_GROUPING,
      );
    });

    it('drops the aggregates with the refused keys', () => {
      // An aggregate is computed per group, so a seed with no surviving key has
      // nothing for it to describe — and leaving it would resurrect it on the
      // next grouping the user applies.
      expect(
        getInitialGroupingState({
          groupingAggregates: { total_amount: 'sum' },
          groupingKeys: keysOfLength(MAX_TABLE_GROUP_KEYS + 1),
        }),
      ).toStrictEqual(NO_GROUPING);
    });

    it('drops an aggregate the loader supplied with no key at all', () => {
      expect(
        getInitialGroupingState({
          groupingAggregates: { total_amount: 'sum' },
          groupingKeys: [],
        }),
      ).toStrictEqual(NO_GROUPING);
    });
  });
});
