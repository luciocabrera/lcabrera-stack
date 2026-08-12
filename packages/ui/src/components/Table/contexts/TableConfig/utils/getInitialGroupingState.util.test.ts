import { describe, expect, it } from 'vite-plus/test';

import { getInitialGroupingState } from './getInitialGroupingState.util';

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
});
