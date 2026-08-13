import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';

import { applyGroupingReducer } from './applyGroupingReducer.util';

const NO_GROUPING: TableGroupingState = { aggregates: {}, keys: [] };

describe('applyGroupingReducer', () => {
  it('resolves the reducer against the snapshot it was handed', () => {
    expect(
      applyGroupingReducer({
        deriveNextGrouping: (grouping) => ({
          aggregates: grouping.aggregates,
          keys: [...grouping.keys, 'shipping_country'],
        }),
        existingGrouping: { aggregates: {}, keys: ['order_status'] },
      }),
    ).toStrictEqual({
      grouping: {
        aggregates: {},
        keys: ['order_status', 'shipping_country'],
      },
      kind: 'updated',
      persistenceEntry: {
        searchParamKey: 'grouping',
        searchParamValue: '{"keys":["order_status","shipping_country"]}',
      },
    });
  });

  it('passes the snapshot to the reducer rather than re-reading anything', () => {
    // The reducer is the only thing that sees the current state, and it sees
    // exactly what the caller read — which is what makes the single-read rule
    // enforceable at the call site instead of by convention.
    const seen: TableGroupingState[] = [];

    applyGroupingReducer({
      deriveNextGrouping: (grouping) => {
        seen.push(grouping);
        return grouping;
      },
      existingGrouping: { aggregates: { total_amount: 'sum' }, keys: ['a'] },
    });

    expect(seen).toStrictEqual([
      { aggregates: { total_amount: 'sum' }, keys: ['a'] },
    ]);
  });

  it('answers unchanged when the reducer returns the configuration applied', () => {
    expect(
      applyGroupingReducer({
        deriveNextGrouping: (grouping) => grouping,
        existingGrouping: { aggregates: {}, keys: ['order_status'] },
      }),
    ).toStrictEqual({ kind: 'unchanged' });
  });

  it('answers unchanged for a key list past the depth cap, refusing it whole', () => {
    expect(
      applyGroupingReducer({
        deriveNextGrouping: () => ({
          aggregates: {},
          keys: Array.from(
            { length: MAX_TABLE_GROUP_KEYS + 1 },
            (_, index) => `key_${index}`,
          ),
        }),
        existingGrouping: NO_GROUPING,
      }),
    ).toStrictEqual({ kind: 'unchanged' });
  });
});
