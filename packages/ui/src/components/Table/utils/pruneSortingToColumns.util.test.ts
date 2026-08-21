import { describe, expect, it } from 'vite-plus/test';

import type {
  SortingState,
  TableColumn,
} from '#ui/components/Table/Table.types';

import { pruneSortingToColumns } from './pruneSortingToColumns.util';

type Row = {
  readonly customer_type: string;
  readonly total_amount: number;
};

const painted = [
  { key: 'customer_type', label: 'Customer Type' },
  { key: 'total_amount:avg', label: 'Average' },
] as TableColumn<Row>[];

describe('pruneSortingToColumns', () => {
  it('keeps a sort on a column the grid still paints', () => {
    const sorting = [
      { columnKey: 'total_amount:avg', direction: 'desc' },
    ] as SortingState<Row>;

    expect(
      pruneSortingToColumns<Row>({ columns: painted, sorting }),
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
      pruneSortingToColumns<Row>({ columns: painted, sorting }),
    ).toStrictEqual([{ columnKey: 'customer_type', direction: 'asc' }]);
  });

  it('returns the same array when nothing was pruned', () => {
    // Identity, not just equality — a grouping change that touches no sort must
    // not invalidate a memo downstream.
    const sorting = [
      { columnKey: 'customer_type', direction: 'asc' },
    ] as SortingState<Row>;

    expect(pruneSortingToColumns<Row>({ columns: painted, sorting })).toBe(
      sorting,
    );
  });

  it('drops everything when the grid paints nothing', () => {
    const sorting = [
      { columnKey: 'customer_type', direction: 'asc' },
    ] as SortingState<Row>;

    expect(pruneSortingToColumns<Row>({ columns: [], sorting })).toStrictEqual(
      [],
    );
  });
});
