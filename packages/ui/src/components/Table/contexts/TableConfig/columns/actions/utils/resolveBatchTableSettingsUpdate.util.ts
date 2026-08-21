import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableColumn,
  TableColumnAggregate,
} from '#ui/components/Table/Table.types';

import {
  deriveColumnViewState,
  pruneSortingToColumns,
} from '#ui/components/Table/utils';

export type BatchTableSettingsUpdate<TData> = {
  readonly columnFilters: ColumnFiltersState<TData>;
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columnSizing: ColumnSizingState<TData>;
  readonly columnVisibility: ColumnVisibilityState<TData>;
  readonly sorting: SortingState<TData>;
};

type ResolveBatchTableSettingsUpdateArgs<TData> = {
  /**
   * The aggregates the same Accept is committing — the **next** ones, so the
   * measure columns appear and disappear in the same write that turns grouping
   * on or off.
   */
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columns: readonly TableColumn<TData>[];
  /**
   * The group keys the same Accept is committing — the **next** ones, not the
   * applied ones, so the hierarchy column appears and disappears in the same
   * write that turns grouping on or off (ADR-065).
   */
  readonly groupingKeys: readonly string[];
  readonly settings: BatchTableSettingsUpdate<TData>;
};

export const resolveBatchTableSettingsUpdate = <TData>({
  aggregates,
  columns,
  groupingKeys,
  settings,
}: ResolveBatchTableSettingsUpdateArgs<TData>) => {
  const {
    effectiveColumns,
    normalizedColumns,
    pinnedColumnOffsets,
    pinnedColumnPartition,
  } = deriveColumnViewState<TData>({
    aggregates,
    columnOrder: settings.columnOrder,
    columnPinning: settings.columnPinning,
    columns,
    columnSizing: settings.columnSizing,
    columnVisibility: settings.columnVisibility,
    groupingKeys,
    sorting: settings.sorting,
  });

  return {
    ...settings,
    effectiveColumns,
    normalizedColumns,
    pinnedColumnOffsets,
    pinnedColumnPartition,
    // A measure column exists only while its aggregate is applied, so this
    // Accept can take away the very column the sort names — and the ungrouped
    // read refuses an unknown column rather than ignoring it.
    sorting: pruneSortingToColumns<TData>({
      columns: effectiveColumns,
      sorting: settings.sorting,
    }),
  };
};
