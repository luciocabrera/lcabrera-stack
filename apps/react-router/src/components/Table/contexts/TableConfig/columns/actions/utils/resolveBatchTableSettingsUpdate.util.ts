import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableColumn,
} from '@/components/Table/Table.types';

import { deriveColumnViewState } from '@/components/Table/utils';

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

type ResolveBatchTableSettingsUpdateResult<TData> =
  BatchTableSettingsUpdate<TData> & {
    readonly columnGroups: ReturnType<
      typeof deriveColumnViewState<TData>
    >['columnGroups'];
    readonly effectiveColumns: ReturnType<
      typeof deriveColumnViewState<TData>
    >['effectiveColumns'];
    readonly normalizedColumns: ReturnType<
      typeof deriveColumnViewState<TData>
    >['normalizedColumns'];
    readonly pinnedColumnOffsets: ReturnType<
      typeof deriveColumnViewState<TData>
    >['pinnedColumnOffsets'];
  };

export const resolveBatchTableSettingsUpdate = <TData>({
  columns,
  settings,
}: ResolveBatchTableSettingsUpdateArgs<TData>): ResolveBatchTableSettingsUpdateResult<TData> => {
  const {
    columnGroups,
    effectiveColumns,
    normalizedColumns,
    pinnedColumnOffsets,
  } = deriveColumnViewState<TData>({
    columnOrder: settings.columnOrder,
    columnPinning: settings.columnPinning,
    columnSizing: settings.columnSizing,
    columns,
    columnVisibility: settings.columnVisibility,
    sorting: settings.sorting,
  });

  return {
    ...settings,
    columnGroups,
    effectiveColumns,
    normalizedColumns,
    pinnedColumnOffsets,
  };
};
