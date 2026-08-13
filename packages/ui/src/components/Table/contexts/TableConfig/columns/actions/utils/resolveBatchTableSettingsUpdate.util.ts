import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableColumn,
} from '#ui/components/Table/Table.types';

import { deriveColumnViewState } from '#ui/components/Table/utils';

export type BatchTableSettingsUpdate<TData> = {
  readonly columnFilters: ColumnFiltersState<TData>;
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columnSizing: ColumnSizingState<TData>;
  readonly columnVisibility: ColumnVisibilityState<TData>;
  readonly sorting: SortingState<TData>;
};

type ResolveBatchTableSettingsUpdateArgs<TData> = {
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
  };
};
