import type {
  TableColumnAggregate,
  TableColumnsState,
} from '#ui/components/Table/Table.types';

import {
  deriveColumnViewState,
  pruneSortingToColumns,
} from '#ui/components/Table/utils';

type ResolveGroupingColumnsPatchArgs<TData> = {
  /** The aggregates about to be applied, not the ones currently applied. */
  readonly aggregates: readonly TableColumnAggregate[];
  /** The snapshot the caller already read — never a second `store.get()`. */
  readonly columnsState: TableColumnsState<TData>;
  /** The group keys about to be applied, not the ones currently applied. */
  readonly groupingKeys: readonly string[];
};

/**
 * The columns-store patch a grouping change produces: the derived view state
 * re-computed for the new key list, and nothing else.
 *
 * A grouping change is the one interaction that alters which columns the grid
 * paints without touching a single piece of column state — the hierarchy column
 * is a rendering of the grouping configuration (ADR-065), so it appears and
 * disappears with the keys. The derived slices live on the columns store, so
 * that store has to be written even though the user's own column state is
 * untouched.
 *
 * Only the derived members are returned, **plus one correction**. `columns`,
 * `columnOrder` and `columnPinning` come back out of the snapshot unchanged and
 * are deliberately not in the patch: none of them is state, so the cookie the
 * layout persists through and the list the settings drawer offers both stay
 * exactly as the user left them.
 *
 * `sorting` is the exception, and it is a correction rather than a preference.
 * A measure column exists only while its aggregate is applied, so a grouping
 * change can take away the very column the sort names — and the ungrouped read
 * refuses an unknown column rather than ignoring it, failing the whole table.
 * See `pruneSortingToColumns`.
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
    sorting: pruneSortingToColumns<TData>({
      columns: derived.effectiveColumns,
      sorting: columnsState.sorting,
    }),
  };
};
