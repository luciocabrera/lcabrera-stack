import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableColumn,
} from '@lcabrera/ui/components/Table/Table.types';

import { deriveColumnViewState } from '@lcabrera/ui/components/Table/utils';

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
  readonly settings: BatchTableSettingsUpdate<TData>;
};

export const resolveBatchTableSettingsUpdate = <TData>({
  columns,
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
