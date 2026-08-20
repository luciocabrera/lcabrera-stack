import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { toggleGroupShare } from './toggleGroupShare.util';

type GroupingArgs = {
  readonly aggregates?: TableGroupingState['aggregates'];
  readonly shares?: TableGroupingState['shares'];
};

const grouping = ({
  aggregates = [{ columnKey: 'revenue', fn: 'sum' }],
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
      toggleGroupShare({
        columnKey: 'revenue',
        fn: 'sum',
        grouping: grouping(),
      }).shares,
    ).toStrictEqual([{ columnKey: 'revenue', fn: 'sum' }]);
  });

  it('turns it off again', () => {
    expect(
      toggleGroupShare({
        columnKey: 'revenue',
        fn: 'sum',
        grouping: grouping({ shares: [{ columnKey: 'revenue', fn: 'sum' }] }),
      }).shares,
    ).toStrictEqual([]);
  });

  it('offers a share on a count, which is additive too', () => {
    expect(
      toggleGroupShare({
        columnKey: 'orders',
        fn: 'count',
        grouping: grouping({
          aggregates: [{ columnKey: 'orders', fn: 'count' }],
        }),
      }).shares,
    ).toStrictEqual([{ columnKey: 'orders', fn: 'count' }]);
  });

  it('refuses a share on an average', () => {
    // The mean of group means is not the mean of the set, so no denominator the
    // client can derive is the one this would divide by.
    expect(
      toggleGroupShare({
        columnKey: 'revenue',
        fn: 'avg',
        grouping: grouping({
          aggregates: [{ columnKey: 'revenue', fn: 'avg' }],
        }),
      }).shares,
    ).toStrictEqual([]);
  });

  it('refuses a share on a distinct count', () => {
    // The dangerous one: summing per-group distinct counts counts a value once
    // per group it appears in, and the resulting shares still add to 100%.
    expect(
      toggleGroupShare({
        columnKey: 'country',
        fn: 'countDistinct',
        grouping: grouping({
          aggregates: [{ columnKey: 'country', fn: 'countDistinct' }],
        }),
      }).shares,
    ).toStrictEqual([]);
  });

  it('refuses a share on a column with no aggregate at all', () => {
    expect(
      toggleGroupShare({
        columnKey: 'unmeasured',
        fn: 'sum',
        grouping: grouping(),
      }).shares,
    ).toStrictEqual([]);
  });

  it('refuses a share on a function that column does not carry', () => {
    // The pair is the identity: `revenue` carries `sum`, so a share of
    // `count(revenue)` names a measure the read will not produce.
    expect(
      toggleGroupShare({
        columnKey: 'revenue',
        fn: 'count',
        grouping: grouping(),
      }).shares,
    ).toStrictEqual([]);
  });

  it('toggles each of one column two shareable measures independently', () => {
    const both = grouping({
      aggregates: [
        { columnKey: 'revenue', fn: 'sum' },
        { columnKey: 'revenue', fn: 'count' },
      ],
    });

    const withSum = toggleGroupShare({
      columnKey: 'revenue',
      fn: 'sum',
      grouping: both,
    });
    const withBoth = toggleGroupShare({
      columnKey: 'revenue',
      fn: 'count',
      grouping: withSum,
    });

    expect(withBoth.shares).toStrictEqual([
      { columnKey: 'revenue', fn: 'sum' },
      { columnKey: 'revenue', fn: 'count' },
    ]);

    // Turning one back off leaves the other exactly where it was — the failure a
    // column-keyed share could not avoid (#831).
    expect(
      toggleGroupShare({
        columnKey: 'revenue',
        fn: 'sum',
        grouping: withBoth,
      }).shares,
    ).toStrictEqual([{ columnKey: 'revenue', fn: 'count' }]);
  });

  it('still removes a share whose aggregate has since been removed', () => {
    // The way out has to work whatever is applied now, or a share applied under
    // `sum` and then left behind would be stuck on.
    expect(
      toggleGroupShare({
        columnKey: 'revenue',
        fn: 'sum',
        grouping: grouping({
          aggregates: [{ columnKey: 'revenue', fn: 'avg' }],
          shares: [{ columnKey: 'revenue', fn: 'sum' }],
        }),
      }).shares,
    ).toStrictEqual([]);
  });

  it('leaves the rest of the configuration alone', () => {
    const before = grouping();
    const after = toggleGroupShare({
      columnKey: 'revenue',
      fn: 'sum',
      grouping: before,
    });

    expect(after.keys).toStrictEqual(before.keys);
    expect(after.mode).toBe(before.mode);
    expect(after.aggregates).toStrictEqual(before.aggregates);
    expect(before.shares).toStrictEqual([]);
  });
});
