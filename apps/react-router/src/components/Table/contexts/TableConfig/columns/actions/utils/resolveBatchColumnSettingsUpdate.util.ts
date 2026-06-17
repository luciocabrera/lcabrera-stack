import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  DataKey,
  SortingState,
  TableColumn,
  TableColumnsState,
} from '@/components/Table/Table.types';
import type { ColumnFilter } from '@/types/filterOperators.types';
import type { SortDirection } from '@/types/ui.types';

import {
  deriveColumnViewState,
  syncColumnOrderWithPinning,
} from '@/components/Table/utils';
import { getNewColumnFiltersBasedOnColumnKey } from '@/components/Table/utils/getNewColumnFiltersBasedOnColumnKey.util';
import { getNewColumnSizingBasedOnColumnKey } from '@/components/Table/utils/getNewColumnSizingBasedOnColumnKey.util';
import { getNewPinningBasedOnColumnKey } from '@/components/Table/utils/getNewPinningBasedOnColumnKey.util';
import { getNewSortingBasedOnColumnKey } from '@/components/Table/utils/getNewSortingBasedOnColumnKey.util';

export type BatchColumnSettingsUpdate<TData> = {
  readonly columnFilter?: ColumnFilter;
  readonly columnKey: DataKey<TData>;
  readonly columnPinning?: 'left' | 'right';
  readonly columnSizing?: number;
  readonly sorting?: SortDirection;
};

type ResolveBatchColumnSettingsUpdateArgs<TData> = {
  readonly columnsState?: Partial<TableColumnsState<TData>>;
  readonly settings: BatchColumnSettingsUpdate<TData>;
};

type ResolveBatchColumnSettingsUpdateResult<TData> = {
  readonly columnFilters: ColumnFiltersState<TData>;
  readonly columnGroups: ReturnType<
    typeof deriveColumnViewState<TData>
  >['columnGroups'];
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columnSizing: ColumnSizingState<TData>;
  readonly effectiveColumns: ReturnType<
    typeof deriveColumnViewState<TData>
  >['effectiveColumns'];
  readonly normalizedColumns: ReturnType<
    typeof deriveColumnViewState<TData>
  >['normalizedColumns'];
  readonly pinnedColumnOffsets: ReturnType<
    typeof deriveColumnViewState<TData>
  >['pinnedColumnOffsets'];
  readonly sorting: SortingState<TData>;
};

export const resolveBatchColumnSettingsUpdate = <TData>({
  columnsState,
  settings,
}: ResolveBatchColumnSettingsUpdateArgs<TData>): ResolveBatchColumnSettingsUpdateResult<TData> => {
  const { columnFilter, columnKey, columnPinning, columnSizing, sorting } =
    settings;
  const columns = (columnsState?.columns ??
    []) as readonly TableColumn<TData>[];

  const newSorting = getNewSortingBasedOnColumnKey<TData>({
    columnKey,
    existingSorting: columnsState?.sorting,
    sorting,
  });

  const newColumnFilters = getNewColumnFiltersBasedOnColumnKey<TData>({
    columnFiltersState: columnsState?.columnFilters,
    columnFilter,
    columnKey,
  });

  const newColumnSizing = getNewColumnSizingBasedOnColumnKey<TData>({
    columnKey,
    columnSizesState: columnsState?.columnSizing,
    columnSizing,
  });

  const newPinning = getNewPinningBasedOnColumnKey<TData>({
    columnKey,
    columnPinning,
    existingPinning: columnsState?.columnPinning,
    staticKeys: columnsState?.staticKeys,
  });

  const newColumnOrder = syncColumnOrderWithPinning<TData>({
    columnKey,
    columnPinning,
    columns,
    currentOrder: columnsState?.columnOrder,
    previousPinning: columnsState?.columnPinning,
    newPinning,
  });

  const {
    columnGroups,
    effectiveColumns,
    normalizedColumns,
    pinnedColumnOffsets,
  } = deriveColumnViewState<TData>({
    columnOrder: newColumnOrder,
    columnPinning: newPinning,
    columnSizing: newColumnSizing,
    columns,
    sorting: newSorting,
  });

  return {
    columnFilters: newColumnFilters,
    columnGroups,
    columnOrder: newColumnOrder,
    columnPinning: newPinning,
    columnSizing: newColumnSizing,
    effectiveColumns,
    normalizedColumns,
    pinnedColumnOffsets,
    sorting: newSorting,
  };
};
