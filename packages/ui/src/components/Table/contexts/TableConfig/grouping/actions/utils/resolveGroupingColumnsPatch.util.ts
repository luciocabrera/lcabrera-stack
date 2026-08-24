import type {
  TableColumnAggregate,
  TableColumnsState,
} from '#ui/components/Table/Table.types';

import {
  deriveColumnViewState,
  pruneSortingToColumns,
} from '#ui/components/Table/utils';

type ResolveGroupingColumnsPatchArgs<TData> = {
  readonly aggregates: readonly TableColumnAggregate[];
  /** The snapshot the caller already read — never a second `store.get()`. */
  readonly columnsState: TableColumnsState<TData>;
  readonly groupingKeys: readonly string[];
};

/**
 * The columns-store patch a grouping change produces: the derived view state re-computed
 * for the new key list, and nothing else.
 * A grouping change is the one interaction that alters which columns the grid paints
 * without touching a single piece of column state — the hierarchy column is a rendering of
 * the grouping configuration (ADR-065), so it appears and disappears with the keys.
 */
export const resolveGroupingColumnsPatch = <TData>({
  aggregates,
  columnsState,
  groupingKeys,
}: ResolveGroupingColumnsPatchArgs<TData>) => {
  const derived = deriveColumnViewState<TData>({
    aggregates,
    columnOrder: columnsState.columnOrder,
    columnPinning: columnsState.columnPinning,
    columns: columnsState.columns,
    columnSizing: columnsState.columnSizing,
    columnVisibility: columnsState.columnVisibility,
    groupingKeys,
    sorting: columnsState.sorting,
  });

  return {
    ...derived,
    // The declared columns beside the painted ones, because a measured column
    // is *replaced* while grouped: pruning against the grid alone would take a
    // pre-existing sort on `total_amount` with it, and the caller writes the
    // result into the URL. `normalizedColumns` rather than `effectiveColumns`
    // for the painted half: the latter is visibility-filtered, so pruning
    // against it would drop the sort of a column the user merely hid.
    sorting: pruneSortingToColumns<TData>({
      declaredColumnKeys: columnsState.columns.map((column) =>
        String(column.key),
      ),
      gridColumnKeys: Object.keys(derived.normalizedColumns),
      sorting: columnsState.sorting,
    }),
  };
};
