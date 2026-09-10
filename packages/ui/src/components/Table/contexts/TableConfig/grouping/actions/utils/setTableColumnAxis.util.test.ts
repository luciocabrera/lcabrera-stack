import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { setTableColumnAxis } from './setTableColumnAxis.util';

const grouping = (
  patch: Partial<TableGroupingState> = {},
): TableGroupingState => ({
  aggregates: [],
  keys: ['region'],
  mode: 'flat',
  periods: {},
  shares: [],
  totalsPlacement: 'last',
  ...patch,
});

describe('setTableColumnAxis', () => {
  it('sets an axis that is not a row key', () => {
    expect(
      setTableColumnAxis({
        columnAxis: 'order_status',
        grouping: grouping(),
      }).columnAxis,
    ).toBe('order_status');
  });

  it('clears an axis', () => {
    expect(
      setTableColumnAxis({
        columnAxis: undefined,
        grouping: grouping({ columnAxis: 'order_status' }),
      }).columnAxis,
    ).toBeUndefined();
  });

  it('refuses an axis that is already a row key', () => {
    expect(
      setTableColumnAxis({
        columnAxis: 'region',
        grouping: grouping(),
      }),
    ).toStrictEqual(grouping());
  });

  it('keeps the current axis rather than clearing it when the next one is a row key', () => {
    const current = grouping({ columnAxis: 'order_status' });

    expect(
      setTableColumnAxis({
        columnAxis: 'region',
        grouping: current,
      }),
    ).toBe(current);
  });

  it('returns the same object when the axis is unchanged', () => {
    const current = grouping({ columnAxis: 'order_status' });

    expect(
      setTableColumnAxis({ columnAxis: 'order_status', grouping: current }),
    ).toBe(current);
  });
});
