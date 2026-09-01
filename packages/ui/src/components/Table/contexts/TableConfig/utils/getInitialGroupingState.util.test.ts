import { describe, expect, it } from 'vite-plus/test';

import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';

import { getInitialGroupingState } from './getInitialGroupingState.util';

const NO_GROUPING = {
  aggregates: [],
  keys: [],
  mode: 'flat',
  periods: {},
  shares: [],
};

const keysOfLength = (length: number) =>
  Array.from({ length }, (_unused, index) => `key_${index}`);

describe('getInitialGroupingState', () => {
  it('seeds the mode the loader applied', () => {
    expect(
      getInitialGroupingState({
        groupingKeys: ['order_status'],
        groupingMode: 'rollup',
      }).mode,
    ).toBe('rollup');
  });

  it('defaults the mode to flat, which is what a pre-rollup link means', () => {
    expect(
      getInitialGroupingState({ groupingKeys: ['order_status'] }).mode,
    ).toBe('flat');
  });

  it('seeds the keys the loader applied', () => {
    expect(
      getInitialGroupingState({ groupingKeys: ['order_status'] }),
    ).toStrictEqual({
      aggregates: [],
      keys: ['order_status'],
      mode: 'flat',
      periods: {},
      shares: [],
    });
  });

  it('seeds the aggregates the loader applied', () => {
    expect(
      getInitialGroupingState({
        groupingAggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
        groupingKeys: ['order_status'],
      }),
    ).toStrictEqual({
      aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
      keys: ['order_status'],
      mode: 'flat',
      periods: {},
      shares: [],
    });
  });

  it('defaults to no grouping when the loader supplied none', () => {
    expect(getInitialGroupingState({})).toStrictEqual({
      aggregates: [],
      keys: [],
      mode: 'flat',
      periods: {},
      shares: [],
    });
  });

  it('copies the loader state rather than aliasing it', () => {
    const groupingAggregates = [
      { columnKey: 'total_amount', fn: 'sum' },
    ] as const;
    const groupingKeys = ['order_status'];
    const state = getInitialGroupingState({ groupingAggregates, groupingKeys });

    expect(state.keys).not.toBe(groupingKeys);
    expect(state.keys).toStrictEqual(groupingKeys);
    expect(state.aggregates).not.toBe(groupingAggregates);
    expect(state.aggregates).toStrictEqual(groupingAggregates);
  });

  describe('depth cap', () => {
    it('seeds exactly the cap', () => {
      const groupingKeys = keysOfLength(MAX_TABLE_GROUP_KEYS);

      expect(getInitialGroupingState({ groupingKeys }).keys).toStrictEqual(
        groupingKeys,
      );
    });

    it('refuses one key past the cap, whole rather than truncated', () => {
      const groupingKeys = keysOfLength(MAX_TABLE_GROUP_KEYS + 1);

      expect(getInitialGroupingState({ groupingKeys })).toStrictEqual(
        NO_GROUPING,
      );
    });

    it('drops the aggregates with the refused keys', () => {
      expect(
        getInitialGroupingState({
          groupingAggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
          groupingKeys: keysOfLength(MAX_TABLE_GROUP_KEYS + 1),
        }),
      ).toStrictEqual(NO_GROUPING);
    });

    it('drops an aggregate the loader supplied with no key at all', () => {
      expect(
        getInitialGroupingState({
          groupingAggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
          groupingKeys: [],
        }),
      ).toStrictEqual(NO_GROUPING);
    });
  });

  describe('duplicate keys', () => {
    it('refuses a repeated key, whole rather than de-duplicated', () => {
      expect(
        getInitialGroupingState({
          groupingKeys: ['order_status', 'order_status'],
        }),
      ).toStrictEqual(NO_GROUPING);
    });

    it('refuses a repeat buried among distinct keys', () => {
      expect(
        getInitialGroupingState({
          groupingKeys: ['order_status', 'priority', 'order_status'],
        }),
      ).toStrictEqual(NO_GROUPING);
    });

    it('drops the aggregates with the refused keys', () => {
      expect(
        getInitialGroupingState({
          groupingAggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
          groupingKeys: ['order_status', 'order_status'],
        }),
      ).toStrictEqual(NO_GROUPING);
    });

    it('still seeds a list whose keys are all distinct', () => {
      const groupingKeys = ['order_status', 'priority'];

      expect(getInitialGroupingState({ groupingKeys }).keys).toStrictEqual(
        groupingKeys,
      );
    });
  });

  describe('duplicate aggregates', () => {
    it('refuses a repeated (columnKey, fn) pair, whole rather than de-duplicated', () => {
      expect(
        getInitialGroupingState({
          groupingAggregates: [
            { columnKey: 'total_amount', fn: 'sum' },
            { columnKey: 'total_amount', fn: 'sum' },
          ],
          groupingKeys: ['order_status'],
        }),
      ).toStrictEqual(NO_GROUPING);
    });

    it('refuses a repeat buried among distinct pairs', () => {
      expect(
        getInitialGroupingState({
          groupingAggregates: [
            { columnKey: 'total_amount', fn: 'sum' },
            { columnKey: 'quantity', fn: 'max' },
            { columnKey: 'total_amount', fn: 'sum' },
          ],
          groupingKeys: ['order_status'],
        }),
      ).toStrictEqual(NO_GROUPING);
    });

    it('still seeds several functions on ONE column', () => {
      const groupingAggregates = [
        { columnKey: 'total_amount', fn: 'sum' },
        { columnKey: 'total_amount', fn: 'avg' },
      ] as const;

      expect(
        getInitialGroupingState({
          groupingAggregates,
          groupingKeys: ['order_status'],
        }).aggregates,
      ).toStrictEqual(groupingAggregates);
    });
  });
});
