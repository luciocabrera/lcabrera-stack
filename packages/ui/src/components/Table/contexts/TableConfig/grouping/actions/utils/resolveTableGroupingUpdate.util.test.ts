import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';

import { resolveTableGroupingUpdate } from './resolveTableGroupingUpdate.util';

const NO_GROUPING: TableGroupingState = {
  aggregates: [],
  keys: [],
  mode: 'flat',
  periods: {},
  shares: [],
};

describe('resolveTableGroupingUpdate', () => {
  it('applies a first group key and writes the compact param', () => {
    const result = resolveTableGroupingUpdate({
      existingGrouping: NO_GROUPING,
      nextGrouping: {
        aggregates: [],
        keys: ['order_status'],
        mode: 'flat',
        periods: {},
        shares: [],
      },
    });

    expect(result).toStrictEqual({
      grouping: {
        aggregates: [],
        keys: ['order_status'],
        mode: 'flat',
        periods: {},
        shares: [],
      },
      kind: 'updated',
      persistenceEntry: {
        searchParamKey: 'grouping',
        searchParamValue: '{"keys":["order_status"]}',
      },
    });
  });

  it('applies several keys in the order given, which is the nesting order', () => {
    const result = resolveTableGroupingUpdate({
      existingGrouping: {
        aggregates: [],
        keys: ['order_status'],
        mode: 'flat',
        periods: {},
        shares: [],
      },
      nextGrouping: {
        aggregates: [],
        keys: ['order_status', 'ship_country'],
        mode: 'flat',
        periods: {},
        shares: [],
      },
    });

    expect(result).toStrictEqual({
      grouping: {
        aggregates: [],
        keys: ['order_status', 'ship_country'],
        mode: 'flat',
        periods: {},
        shares: [],
      },
      kind: 'updated',
      persistenceEntry: {
        searchParamKey: 'grouping',
        searchParamValue: '{"keys":["order_status","ship_country"]}',
      },
    });
  });

  it('carries the selected aggregates into the param beside the keys', () => {
    const result = resolveTableGroupingUpdate({
      existingGrouping: {
        aggregates: [],
        keys: ['order_status'],
        mode: 'flat',
        periods: {},
        shares: [],
      },
      nextGrouping: {
        aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
        keys: ['order_status'],
        mode: 'flat',
        periods: {},
        shares: [],
      },
    });

    expect(result).toStrictEqual({
      grouping: {
        aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
        keys: ['order_status'],
        mode: 'flat',
        periods: {},
        shares: [],
      },
      kind: 'updated',
      persistenceEntry: {
        searchParamKey: 'grouping',
        searchParamValue:
          '{"agg":["total_amount:sum"],"keys":["order_status"]}',
      },
    });
  });

  it('refuses a key list past the depth cap rather than truncating it', () => {
    const tooManyKeys = Array.from(
      { length: MAX_TABLE_GROUP_KEYS + 1 },
      (_, index) => `key_${index}`,
    );

    expect(
      resolveTableGroupingUpdate({
        existingGrouping: NO_GROUPING,
        nextGrouping: {
          aggregates: [],
          keys: tooManyKeys,
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }),
    ).toStrictEqual({ kind: 'unchanged' });
  });

  it('accepts exactly the depth cap', () => {
    const maximumKeys = Array.from(
      { length: MAX_TABLE_GROUP_KEYS },
      (_, index) => `key_${index}`,
    );

    expect(
      resolveTableGroupingUpdate({
        existingGrouping: NO_GROUPING,
        nextGrouping: {
          aggregates: [],
          keys: maximumKeys,
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }).kind,
    ).toBe('updated');
  });

  it('drops the param and the aggregates when the last key goes', () => {
    const result = resolveTableGroupingUpdate({
      existingGrouping: {
        aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
        keys: ['order_status'],
        mode: 'flat',
        periods: {},
        shares: [],
      },
      nextGrouping: {
        aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
        keys: [],
        mode: 'flat',
        periods: {},
        shares: [],
      },
    });

    expect(result).toStrictEqual({
      grouping: NO_GROUPING,
      kind: 'updated',
      persistenceEntry: {
        searchParamKey: 'grouping',
        searchParamValue: undefined,
      },
    });
  });

  it('answers unchanged for a repeat of the applied configuration', () => {
    const applied: TableGroupingState = {
      aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
      keys: ['order_status'],
      mode: 'flat',
      periods: {},
      shares: [],
    };

    expect(
      resolveTableGroupingUpdate({
        existingGrouping: applied,
        nextGrouping: {
          aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
          keys: ['order_status'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }),
    ).toStrictEqual({ kind: 'unchanged' });
  });

  it('treats a reordering of the same keys as a change', () => {
    expect(
      resolveTableGroupingUpdate({
        existingGrouping: {
          aggregates: [],
          keys: ['a', 'b'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
        nextGrouping: {
          aggregates: [],
          keys: ['b', 'a'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }).kind,
    ).toBe('updated');
  });

  it('treats an aggregate change alone as a change', () => {
    expect(
      resolveTableGroupingUpdate({
        existingGrouping: {
          aggregates: [{ columnKey: 'amount', fn: 'sum' }],
          keys: ['a'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
        nextGrouping: {
          aggregates: [{ columnKey: 'amount', fn: 'avg' }],
          keys: ['a'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }).kind,
    ).toBe('updated');
  });

  it('refuses a repeated key rather than de-duplicating it', () => {
    expect(
      resolveTableGroupingUpdate({
        existingGrouping: NO_GROUPING,
        nextGrouping: {
          aggregates: [],
          keys: ['order_status', 'order_status'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }),
    ).toStrictEqual({ kind: 'unchanged' });
  });

  it('leaves an applied grouping alone when the requested list repeats a key', () => {
    const applied: TableGroupingState = {
      aggregates: [],
      keys: ['order_status'],
      mode: 'flat',
      periods: {},
      shares: [],
    };

    expect(
      resolveTableGroupingUpdate({
        existingGrouping: applied,
        nextGrouping: {
          aggregates: [],
          keys: ['priority', 'priority'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }),
    ).toStrictEqual({ kind: 'unchanged' });
  });

  it('still accepts a list whose keys are all distinct', () => {
    expect(
      resolveTableGroupingUpdate({
        existingGrouping: NO_GROUPING,
        nextGrouping: {
          aggregates: [],
          keys: ['order_status', 'priority'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }).kind,
    ).toBe('updated');
  });

  it('answers unchanged when nothing was grouped and nothing is asked for', () => {
    expect(
      resolveTableGroupingUpdate({
        existingGrouping: NO_GROUPING,
        nextGrouping: NO_GROUPING,
      }),
    ).toStrictEqual({ kind: 'unchanged' });
  });

  it('drops the grouping param when the last key is cleared', () => {
    expect(
      resolveTableGroupingUpdate({
        existingGrouping: {
          aggregates: [],
          keys: ['order_status'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
        nextGrouping: {
          aggregates: [],
          keys: [],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }),
    ).toMatchObject({
      kind: 'updated',
      persistenceEntry: {
        searchParamKey: 'grouping',
        searchParamValue: undefined,
      },
    });
  });

  it('records the clear in the URL instead on a route with a default', () => {
    expect(
      resolveTableGroupingUpdate({
        existingGrouping: {
          aggregates: [],
          keys: ['order_status'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
        hasDefaultGrouping: true,
        nextGrouping: {
          aggregates: [],
          keys: [],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }),
    ).toMatchObject({
      kind: 'updated',
      persistenceEntry: {
        searchParamKey: 'grouping',
        searchParamValue: '{"keys":[]}',
      },
    });
  });
});
