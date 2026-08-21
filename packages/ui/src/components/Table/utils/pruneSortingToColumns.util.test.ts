import { describe, expect, it } from 'vite-plus/test';

import type { SortingState } from '#ui/components/Table/Table.types';

import { pruneSortingToColumns } from './pruneSortingToColumns.util';

type Row = {
  readonly customer_type: string;
  readonly total_amount: number;
};

/** What the grid has, before visibility is applied. */
const painted = ['customer_type', 'total_amount:avg'];

describe('pruneSortingToColumns', () => {
  it('keeps a sort on a column the grid still paints', () => {
    const sorting = [
      { columnKey: 'total_amount:avg', direction: 'desc' },
    ] as SortingState<Row>;

    expect(
      pruneSortingToColumns<Row>({ columnKeys: painted, sorting }),
    ).toStrictEqual(sorting);
  });

  it('drops a sort naming a measure column the grouping took away', () => {
    // The reachable path: sort by a measure, then clear the grouping. The
    // ungrouped read validates every column against `allowedColumns` and
    // refuses an unknown one, so the whole table fails rather than the sort
    // being ignored.
    const sorting = [
      { columnKey: 'customer_type', direction: 'asc' },
      { columnKey: 'total_amount:min', direction: 'desc' },
    ] as SortingState<Row>;

    expect(
      pruneSortingToColumns<Row>({ columnKeys: painted, sorting }),
    ).toStrictEqual([{ columnKey: 'customer_type', direction: 'asc' }]);
  });

  it('returns the same array when nothing was pruned', () => {
    // Identity, not just equality — a grouping change that touches no sort must
    // not invalidate a memo downstream.
    const sorting = [
      { columnKey: 'customer_type', direction: 'asc' },
    ] as SortingState<Row>;

    expect(pruneSortingToColumns<Row>({ columnKeys: painted, sorting })).toBe(
      sorting,
    );
  });

  it('keeps a sort on a column the user merely hid', () => {
    // The promise this pins: hiding is a view preference and the column is
    // still there to order by. Pruning against `effectiveColumns` — which is
    // visibility-filtered — would break exactly this case.
    const sorting = [
      { columnKey: 'total_amount:avg', direction: 'desc' },
    ] as SortingState<Row>;

    // `painted` is the pre-visibility list, so a hidden `total_amount:avg` is
    // still in it and its sort survives.
    expect(pruneSortingToColumns<Row>({ columnKeys: painted, sorting })).toBe(
      sorting,
    );
  });

  it('drops everything when the grid paints nothing', () => {
    const sorting = [
      { columnKey: 'customer_type', direction: 'asc' },
    ] as SortingState<Row>;

    expect(
      pruneSortingToColumns<Row>({ columnKeys: [], sorting }),
    ).toStrictEqual([]);
  });
});
