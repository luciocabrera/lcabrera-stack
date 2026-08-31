import { describe, expect, it } from 'vite-plus/test';

import type { SortingState } from '#ui/components/Table/Table.types';

import { pruneSortingToColumns } from './pruneSortingToColumns.util';

type Row = {
  readonly customer_type: string;
  readonly total_amount: number;
};

const declared = ['customer_type', 'total_amount'];

const painted = ['customer_type', 'total_amount:avg'];

type PruneArgs = {
  readonly declaredColumnKeys?: readonly string[];
  readonly gridColumnKeys?: readonly string[];
  readonly sorting: SortingState<Row>;
};

const prune = ({
  declaredColumnKeys = declared,
  gridColumnKeys = painted,
  sorting,
}: PruneArgs) =>
  pruneSortingToColumns<Row>({ declaredColumnKeys, gridColumnKeys, sorting });

describe('pruneSortingToColumns', () => {
  it('keeps a sort on a column the grid still paints', () => {
    const sorting = [
      { columnKey: 'total_amount:avg', direction: 'desc' },
    ] as SortingState<Row>;

    expect(prune({ sorting })).toStrictEqual(sorting);
  });

  it('drops a sort naming a measure column the grouping took away', () => {
    const sorting = [
      { columnKey: 'customer_type', direction: 'asc' },
      { columnKey: 'total_amount:min', direction: 'desc' },
    ] as SortingState<Row>;

    expect(prune({ sorting })).toStrictEqual([
      { columnKey: 'customer_type', direction: 'asc' },
    ]);
  });

  it('keeps a sort on a measured column the grid stopped painting', () => {
    const sorting = [
      { columnKey: 'total_amount', direction: 'desc' },
    ] as SortingState<Row>;

    expect(prune({ sorting })).toBe(sorting);
  });

  it('returns the same array when nothing was pruned', () => {
    const sorting = [
      { columnKey: 'customer_type', direction: 'asc' },
    ] as SortingState<Row>;

    expect(prune({ sorting })).toBe(sorting);
  });

  it('keeps a sort on a column the user merely hid', () => {
    const sorting = [
      { columnKey: 'total_amount:avg', direction: 'desc' },
    ] as SortingState<Row>;

    expect(prune({ sorting })).toBe(sorting);
  });

  it('drops a key that is neither declared nor painted', () => {
    const sorting = [
      { columnKey: 'gone_entirely', direction: 'asc' },
    ] as unknown as SortingState<Row>;

    expect(prune({ sorting })).toStrictEqual([]);
  });

  it('drops everything when there is nothing to order by', () => {
    const sorting = [
      { columnKey: 'customer_type', direction: 'asc' },
    ] as SortingState<Row>;

    expect(
      prune({ declaredColumnKeys: [], gridColumnKeys: [], sorting }),
    ).toStrictEqual([]);
  });
});
