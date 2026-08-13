import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { toggleTableGroupKey } from './toggleTableGroupKey.util';

describe('toggleTableGroupKey', () => {
  it('appends a new key at the tail, so it becomes the innermost level', () => {
    expect(
      toggleTableGroupKey({
        columnKey: 'ship_country',
        grouping: { aggregates: {}, keys: ['order_status'] },
      }),
    ).toStrictEqual({
      aggregates: {},
      keys: ['order_status', 'ship_country'],
    });
  });

  it('removes a key that is already applied, keeping the rest in order', () => {
    expect(
      toggleTableGroupKey({
        columnKey: 'ship_country',
        grouping: { aggregates: {}, keys: ['a', 'ship_country', 'b'] },
      }),
    ).toStrictEqual({ aggregates: {}, keys: ['a', 'b'] });
  });

  it('does not cap the depth — that refusal lives in one place', () => {
    // Deliberate: `resolveTableGroupingUpdate` owns the cap, so this returns
    // the over-long list and the resolver refuses it. Two enforcers could
    // disagree; one cannot.
    const grouping: TableGroupingState = {
      aggregates: {},
      keys: ['a', 'b', 'c', 'd', 'e', 'f'],
    };

    expect(toggleTableGroupKey({ columnKey: 'g', grouping }).keys).toHaveLength(
      7,
    );
  });

  it('leaves the aggregates untouched in both directions', () => {
    const aggregates = { total_amount: 'sum' } as const;

    expect(
      toggleTableGroupKey({
        columnKey: 'total_amount',
        grouping: { aggregates, keys: [] },
      }).aggregates,
    ).toStrictEqual(aggregates);
    expect(
      toggleTableGroupKey({
        columnKey: 'total_amount',
        grouping: { aggregates, keys: ['total_amount'] },
      }).aggregates,
    ).toStrictEqual(aggregates);
  });

  it('never mutates the grouping it was handed', () => {
    const keys = ['order_status'];
    const grouping: TableGroupingState = { aggregates: {}, keys };

    toggleTableGroupKey({ columnKey: 'ship_country', grouping });

    expect(keys).toStrictEqual(['order_status']);
  });
});
