import type { SortingState } from '#ui/components/Table/Table.types';

type PruneSortingToColumnsArgs<TData> = {
  /**
   * The consumer's **declared** column keys. Orderable whether or not the grid
   * is currently painting them, which is the whole reason this is a separate
   * argument from the one below.
   */
  readonly declaredColumnKeys: readonly string[];
  /**
   * Every key the grid currently **paints**, derived measures included and
   * **before** visibility is applied. Keys rather than columns because that is
   * the whole question, and because the pre-visibility list is available as the
   * keys of `normalizedColumns` where the painted column array is not.
   */
  readonly gridColumnKeys: readonly string[];
  readonly sorting: SortingState<TData>;
};

/**
 * The sort, with every entry naming a column **nothing can order by** removed.
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
 * **The two key lists are unioned, and taking only the grid's is a data-loss
 * bug.** `withAggregateColumns` *replaces* a measured column, so applying
 * `avg` to `total_amount` takes `total_amount` out of the painted list while
 * leaving it a perfectly ordinary column the read orders by fine. Pruning
 * against the grid alone therefore discarded a pre-existing sort on the
 * measured column — and the caller writes the pruned value into the `sorting`
 * search param, so it was gone from the URL and did not come back on
 * ungrouping. Only a key that exists **nowhere outside a grouping** — a
 * `column:fn` measure key whose aggregate is no longer applied — has to go.
 *
 * **A column the user merely cannot see is never dropped**: a hidden column
 * keeps its sort, because hiding is a view preference and the column is still
 * there to order by. That is why `gridColumnKeys` must be the
 * **pre-visibility** list. `effectiveColumns` is the wrong one and silently
 * breaks this promise — `getEffectiveColumns` filters by visibility first, so
 * sorting a column and then hiding it would drop its sort. Pass the keys of
 * `normalizedColumns`, which is built from `gridColumns`.
 *
 * The identity of the array is preserved when nothing was pruned, so a grouping
 * change that touches no sort does not invalidate a memo downstream.
 */
export const pruneSortingToColumns = <TData>({
  declaredColumnKeys,
  gridColumnKeys,
  sorting,
}: PruneSortingToColumnsArgs<TData>): SortingState<TData> => {
  const orderable = new Set([...gridColumnKeys, ...declaredColumnKeys]);
  const kept = sorting.filter((entry) =>
    orderable.has(String(entry.columnKey)),
  );

  return kept.length === sorting.length ? sorting : kept;
};
