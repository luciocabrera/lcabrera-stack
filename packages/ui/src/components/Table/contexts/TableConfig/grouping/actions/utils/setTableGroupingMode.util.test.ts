import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { setTableGroupingMode } from './setTableGroupingMode.util';

const grouping: TableGroupingState = {
  aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
  keys: ['order_status', 'shipping_country'],
  mode: 'flat',
  periods: {},
  shares: [],
};

describe('setTableGroupingMode', () => {
  it('sets the mode', () => {
    expect(setTableGroupingMode({ grouping, mode: 'rollup' }).mode).toBe(
      'rollup',
    );
  });

  it('leaves the keys and aggregates exactly as they were', () => {
    // Orthogonal by construction: rollup adds the prefixes of the key list to
    // the sets already emitted, so the mode changes how many rows come back
    // and never what any of them is grouped by.
    const result = setTableGroupingMode({ grouping, mode: 'rollup' });

    expect(result.keys).toBe(grouping.keys);
    expect(result.aggregates).toBe(grouping.aggregates);
  });

  it('never mutates the configuration it was handed', () => {
    setTableGroupingMode({ grouping, mode: 'rollup' });

    expect(grouping.mode).toBe('flat');
  });

  it('is settable with no key applied, where it is simply unused', () => {
    // `serializeGroupingToURL` drops the whole configuration when the key list
    // is empty, so a mode nobody can see never reaches the URL.
    expect(
      setTableGroupingMode({
        grouping: {
          aggregates: [],
          keys: [],
          mode: 'flat',
          periods: {},
          shares: [],
        },
        mode: 'rollup',
      }),
    ).toStrictEqual({
      aggregates: [],
      keys: [],
      mode: 'rollup',
      periods: {},
      shares: [],
    });
  });
});
