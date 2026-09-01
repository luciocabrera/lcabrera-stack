import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';

import { applyGroupingReducer } from './applyGroupingReducer.util';

const NO_GROUPING: TableGroupingState = {
  aggregates: [],
  keys: [],
  mode: 'flat',
  periods: {},
  shares: [],
};

describe('applyGroupingReducer', () => {
  it('resolves the reducer against the snapshot it was handed', () => {
    expect(
      applyGroupingReducer({
        deriveNextGrouping: (grouping) => ({
          aggregates: grouping.aggregates,
          keys: [...grouping.keys, 'shipping_country'],
          mode: 'flat',
          periods: {},
          shares: [],
        }),
        existingGrouping: {
          aggregates: [],
          keys: ['order_status'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }),
    ).toStrictEqual({
      grouping: {
        aggregates: [],
        keys: ['order_status', 'shipping_country'],
        mode: 'flat',
        periods: {},
        shares: [],
      },
      kind: 'updated',
      persistenceEntry: {
        searchParamKey: 'grouping',
        searchParamValue: '{"keys":["order_status","shipping_country"]}',
      },
    });
  });

  it('passes the snapshot to the reducer rather than re-reading anything', () => {
    const seen: TableGroupingState[] = [];

    applyGroupingReducer({
      deriveNextGrouping: (grouping) => {
        seen.push(grouping);
        return grouping;
      },
      existingGrouping: {
        aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
        keys: ['a'],
        mode: 'flat',
        periods: {},
        shares: [],
      },
    });

    expect(seen).toStrictEqual([
      {
        aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
        keys: ['a'],
        mode: 'flat',
        periods: {},
        shares: [],
      },
    ]);
  });

  it('answers unchanged when the reducer returns the configuration applied', () => {
    expect(
      applyGroupingReducer({
        deriveNextGrouping: (grouping) => grouping,
        existingGrouping: {
          aggregates: [],
          keys: ['order_status'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }),
    ).toStrictEqual({ kind: 'unchanged' });
  });

  it('answers unchanged for a key list past the depth cap, refusing it whole', () => {
    expect(
      applyGroupingReducer({
        deriveNextGrouping: () => ({
          aggregates: [],
          keys: Array.from(
            { length: MAX_TABLE_GROUP_KEYS + 1 },
            (_, index) => `key_${index}`,
          ),
          mode: 'flat' as const,
          periods: {},
          shares: [],
        }),
        existingGrouping: NO_GROUPING,
      }),
    ).toStrictEqual({ kind: 'unchanged' });
  });
});
