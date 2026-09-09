import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { resolveCommittedGroupingState } from './resolveCommittedGroupingState.util';

const current: TableGroupingState = {
  aggregates: [],
  keys: ['status'],
  mode: 'flat',
  periods: {},
  shares: [],
  totalsPlacement: 'last',
};

const updated: TableGroupingState = {
  aggregates: [{ columnKey: 'amount', fn: 'sum' }],
  keys: ['region'],
  mode: 'rollup',
  periods: {},
  shares: [],
  totalsPlacement: 'last',
};

describe('resolveCommittedGroupingState', () => {
  it('keeps the current grouping and writes the new placement when grouping is unchanged', () => {
    expect(
      resolveCommittedGroupingState({
        currentGrouping: current,
        groupingUpdate: { kind: 'unchanged' },
        totalsPlacement: 'first',
      }),
    ).toEqual({ ...current, totalsPlacement: 'first' });
  });

  it('takes the updated grouping and writes the new placement', () => {
    expect(
      resolveCommittedGroupingState({
        currentGrouping: current,
        groupingUpdate: { grouping: updated, kind: 'updated' },
        totalsPlacement: 'first',
      }),
    ).toEqual({ ...updated, totalsPlacement: 'first' });
  });
});
