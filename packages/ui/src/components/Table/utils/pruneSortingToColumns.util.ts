import type {
  SortingState,
  TableColumn,
} from '#ui/components/Table/Table.types';

type PruneSortingToColumnsArgs<TData> = {
  /** The columns the grid is about to paint — derived measures included. */
  readonly columns: readonly TableColumn<TData>[];
  readonly sorting: SortingState<TData>;
};

/**
 * The sort, with every entry naming a column the grid no longer has removed.
 *
 * **A sort on a derived measure column outlives the column that carried it.**
 * `withAggregateColumns` produces `total_amount:avg` while a grouping is
 * applied and stops producing it the moment the grouping clears, but sorting is
 * ordinary user state and survives — so clearing a grouping while sorted by a
 * measure leaves the read asking to order by a column that exists nowhere. The
 * ungrouped branch hands that straight to `buildSelectQuery`, which validates
 * every column against `allowedColumns` and **refuses** it: the whole table
 * fails rather than the sort being ignored.
 *
 * A stale sort was always reachable by hand-editing the URL and is refused the
 * same way. What is new is reaching it by clicking — sort a measure, clear the
 * grouping — which is why this prunes at the point the columns change rather
 * than validating at the read.
 *
 * **Only a sort whose column has vanished is dropped**, never one the user
 * merely cannot see: a hidden column keeps its sort, because hiding is a view
 * preference and the column is still there to order by. The test is membership
 * of the painted column list, which is what `withAggregateColumns` and
 * `withGroupedColumnLayout` have already resolved by the time this runs.
 *
 * The identity of the array is preserved when nothing was pruned, so a grouping
 * change that touches no sort does not invalidate a memo downstream.
 */
export const pruneSortingToColumns = <TData>({
  columns,
  sorting,
}: PruneSortingToColumnsArgs<TData>): SortingState<TData> => {
  const present = new Set(columns.map((column) => String(column.key)));
  const kept = sorting.filter((entry) => present.has(String(entry.columnKey)));

  return kept.length === sorting.length ? sorting : kept;
};
