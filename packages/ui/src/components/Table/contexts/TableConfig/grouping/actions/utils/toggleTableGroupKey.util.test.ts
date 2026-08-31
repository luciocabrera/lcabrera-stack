import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { toggleTableGroupKey } from './toggleTableGroupKey.util';

describe('toggleTableGroupKey', () => {
  it('appends a new key at the tail, so it becomes the innermost level', () => {
    expect(
      toggleTableGroupKey({
        columnKey: 'ship_country',
        grouping: {
          aggregates: [],
          keys: ['order_status'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }),
    ).toStrictEqual({
      aggregates: [],
      keys: ['order_status', 'ship_country'],
      mode: 'flat',
      periods: {},
      shares: [],
    });
  });

  it('removes a key that is already applied, keeping the rest in order', () => {
    expect(
      toggleTableGroupKey({
        columnKey: 'ship_country',
        grouping: {
          aggregates: [],
          keys: ['a', 'ship_country', 'b'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }),
    ).toStrictEqual({
      aggregates: [],
      keys: ['a', 'b'],
      mode: 'flat',
      periods: {},
      shares: [],
    });
  });

  it('does not cap the depth — that refusal lives in one place', () => {
    const grouping: TableGroupingState = {
      aggregates: [],
      keys: ['a', 'b', 'c', 'd', 'e', 'f'],
      mode: 'flat',
      periods: {},
      shares: [],
    };

    expect(toggleTableGroupKey({ columnKey: 'g', grouping }).keys).toHaveLength(
      7,
    );
  });

  it('leaves the aggregates untouched in both directions', () => {
    const aggregates = [{ columnKey: 'total_amount', fn: 'sum' }] as const;

    expect(
      toggleTableGroupKey({
        columnKey: 'total_amount',
        grouping: {
          aggregates,
          keys: [],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }).aggregates,
    ).toStrictEqual(aggregates);
    expect(
      toggleTableGroupKey({
        columnKey: 'total_amount',
        grouping: {
          aggregates,
          keys: ['total_amount'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }).aggregates,
    ).toStrictEqual(aggregates);
  });

  it('never mutates the grouping it was handed', () => {
    const keys = ['order_status'];
    const grouping: TableGroupingState = {
      aggregates: [],
      keys,
      mode: 'flat',
      periods: {},
      shares: [],
    };

    toggleTableGroupKey({ columnKey: 'ship_country', grouping });

    expect(keys).toStrictEqual(['order_status']);
  });
});
