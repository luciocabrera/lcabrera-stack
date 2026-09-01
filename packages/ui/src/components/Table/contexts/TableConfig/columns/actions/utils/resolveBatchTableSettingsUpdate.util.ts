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
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columns: readonly TableColumn<TData>[];
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
    sorting: pruneSortingToColumns<TData>({
      declaredColumnKeys: columns.map((column) => String(column.key)),
      gridColumnKeys: Object.keys(normalizedColumns),
      sorting: settings.sorting,
    }),
  };
};
