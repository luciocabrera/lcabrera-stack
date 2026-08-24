import type { SortingState } from '#ui/components/Table/Table.types';

type PruneSortingToColumnsArgs<TData> = {
  readonly declaredColumnKeys: readonly string[];
  readonly gridColumnKeys: readonly string[];
  readonly sorting: SortingState<TData>;
};

/**
 * **A sort on a derived measure column outlives the column that carried it.**
 * `withAggregateColumns` produces `total_amount:avg` while a grouping is applied and stops
 * producing it the moment the grouping clears, but sorting is ordinary user state and
 * survives — so clearing a grouping while sorted by a measure leaves the read asking to
 * order by a column that exists nowhere.
 * What is new is reaching it by clicking — sort a measure, clear the grouping — which is
 * why this prunes at the point the columns change rather than validating at the read.
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
