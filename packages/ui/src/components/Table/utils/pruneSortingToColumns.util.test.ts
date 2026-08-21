import { describe, expect, it } from 'vite-plus/test';

import type { SortingState } from '#ui/components/Table/Table.types';

import { pruneSortingToColumns } from './pruneSortingToColumns.util';

type Row = {
  readonly customer_type: string;
  readonly total_amount: number;
};

/** What the consumer declared — orderable whether or not the grid paints it. */
const declared = ['customer_type', 'total_amount'];

/**
 * What the grid paints while `avg` is applied to `total_amount`. Note what is
 * **missing**: `withAggregateColumns` replaces a measured column, so the
 * painted list has no `total_amount` in it at all.
 */
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
    // The reachable path: sort by a measure, then clear the grouping. The
    // ungrouped read validates every column against `allowedColumns` and
    // refuses an unknown one, so the whole table fails rather than the sort
    // being ignored.
    const sorting = [
      { columnKey: 'customer_type', direction: 'asc' },
      { columnKey: 'total_amount:min', direction: 'desc' },
    ] as SortingState<Row>;

    expect(prune({ sorting })).toStrictEqual([
      { columnKey: 'customer_type', direction: 'asc' },
    ]);
  });

  it('keeps a sort on a measured column the grid stopped painting', () => {
    // The data-loss bug this shape exists to prevent. Sorting by
    // `Total Amount` and *then* grouping with `avg(Total Amount)` replaces the
    // column in the grid — but it is still an ordinary column the read orders
    // by fine. Pruning against the painted list alone discarded the sort, and
    // the caller writes the pruned value into the `sorting` search param, so
    // it was gone from the URL and never came back on ungrouping.
    const sorting = [
      { columnKey: 'total_amount', direction: 'desc' },
    ] as SortingState<Row>;

    expect(prune({ sorting })).toBe(sorting);
  });

  it('returns the same array when nothing was pruned', () => {
    // Identity, not just equality — a grouping change that touches no sort must
    // not invalidate a memo downstream.
    const sorting = [
      { columnKey: 'customer_type', direction: 'asc' },
    ] as SortingState<Row>;

    expect(prune({ sorting })).toBe(sorting);
  });

  it('keeps a sort on a column the user merely hid', () => {
    // The promise this pins: hiding is a view preference and the column is
    // still there to order by. Pruning against `effectiveColumns` — which is
    // visibility-filtered — would break exactly this case.
    const sorting = [
      { columnKey: 'total_amount:avg', direction: 'desc' },
    ] as SortingState<Row>;

    expect(prune({ sorting })).toBe(sorting);
  });

  it('drops a key that is neither declared nor painted', () => {
    // A hand-edited URL, or a column the consumer removed between releases.
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
