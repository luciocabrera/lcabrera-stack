import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { toggleGroupShare } from './toggleGroupShare.util';

type GroupingArgs = {
  readonly aggregates?: TableGroupingState['aggregates'];
  readonly shares?: readonly string[];
};

const grouping = ({
  aggregates = { revenue: 'sum' },
  shares = [],
}: GroupingArgs = {}): TableGroupingState => ({
  aggregates,
  keys: ['status'],
  mode: 'flat',
  periods: {},
  shares,
});

describe('toggleGroupShare', () => {
  it('turns a share on for an additive measure', () => {
    expect(
      toggleGroupShare({ columnKey: 'revenue', grouping: grouping() }).shares,
    ).toStrictEqual(['revenue']);
  });

  it('turns it off again', () => {
    expect(
      toggleGroupShare({
        columnKey: 'revenue',
        grouping: grouping({ shares: ['revenue'] }),
      }).shares,
    ).toStrictEqual([]);
  });

  it('offers a share on a count, which is additive too', () => {
    expect(
      toggleGroupShare({
        columnKey: 'orders',
        grouping: grouping({ aggregates: { orders: 'count' } }),
      }).shares,
    ).toStrictEqual(['orders']);
  });

  it('refuses a share on an average', () => {
    // The mean of group means is not the mean of the set, so no denominator the
    // client can derive is the one this would divide by.
    expect(
      toggleGroupShare({
        columnKey: 'revenue',
        grouping: grouping({ aggregates: { revenue: 'avg' } }),
      }).shares,
    ).toStrictEqual([]);
  });

  it('refuses a share on a distinct count', () => {
    // The dangerous one: summing per-group distinct counts counts a value once
    // per group it appears in, and the resulting shares still add to 100%.
    expect(
      toggleGroupShare({
        columnKey: 'country',
        grouping: grouping({ aggregates: { country: 'countDistinct' } }),
      }).shares,
    ).toStrictEqual([]);
  });

  it('refuses a share on a column with no aggregate at all', () => {
    expect(
      toggleGroupShare({ columnKey: 'unmeasured', grouping: grouping() })
        .shares,
    ).toStrictEqual([]);
  });

  it('still removes a share whose aggregate has since changed', () => {
    // The way out has to work whatever the aggregate now is, or a share applied
    // under `sum` and then switched to `avg` would be stuck on.
    expect(
      toggleGroupShare({
        columnKey: 'revenue',
        grouping: grouping({
          aggregates: { revenue: 'avg' },
          shares: ['revenue'],
        }),
      }).shares,
    ).toStrictEqual([]);
  });

  it('leaves the rest of the configuration alone', () => {
    const before = grouping();
    const after = toggleGroupShare({ columnKey: 'revenue', grouping: before });

    expect(after.keys).toStrictEqual(before.keys);
    expect(after.mode).toBe(before.mode);
    expect(after.aggregates).toStrictEqual(before.aggregates);
    expect(before.shares).toStrictEqual([]);
  });
});
