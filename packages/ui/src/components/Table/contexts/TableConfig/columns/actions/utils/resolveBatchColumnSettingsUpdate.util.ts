import type {
  DataKey,
  TableColumn,
  TableColumnsState,
} from '@repo/ui/components/Table/Table.types';
import type { ColumnFilter } from '@repo/ui/types/filterOperators.types';
import type { SortDirection } from '@repo/ui/types/ui.types';

import {
  deriveColumnViewState,
  getColumnPinSide,
  syncColumnOrderWithPinning,
} from '@repo/ui/components/Table/utils';
import { getNewColumnFiltersBasedOnColumnKey } from '@repo/ui/components/Table/utils/getNewColumnFiltersBasedOnColumnKey.util';
import { getNewColumnSizingBasedOnColumnKey } from '@repo/ui/components/Table/utils/getNewColumnSizingBasedOnColumnKey.util';
import { getNewPinningBasedOnColumnKey } from '@repo/ui/components/Table/utils/getNewPinningBasedOnColumnKey.util';
import { getNewSortingBasedOnColumnKey } from '@repo/ui/components/Table/utils/getNewSortingBasedOnColumnKey.util';

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

export const resolveBatchColumnSettingsUpdate = <TData>({
  columnsState,
  settings,
}: ResolveBatchColumnSettingsUpdateArgs<TData>) => {
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
    columnFilter,
    columnFiltersState: columnsState?.columnFilters,
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

  const previousColumnPinning = getColumnPinSide<TData>({
    columnKey,
    pinning: columnsState?.columnPinning,
  });

  const newColumnOrder =
    previousColumnPinning === columnPinning
      ? (columnsState?.columnOrder ?? columns.map((column) => column.key))
      : syncColumnOrderWithPinning<TData>({
          columnKey,
          columnPinning,
          columns,
          currentOrder: columnsState?.columnOrder,
          newPinning,
          previousPinning: columnsState?.columnPinning,
        });

  const {
    effectiveColumns,
    normalizedColumns,
    pinnedColumnOffsets,
    pinnedColumnPartition,
  } = deriveColumnViewState<TData>({
    columnOrder: newColumnOrder,
    columnPinning: newPinning,
    columns,
    columnSizing: newColumnSizing,
    sorting: newSorting,
  });

  return {
    columnFilters: newColumnFilters,
    columnOrder: newColumnOrder,
    columnPinning: newPinning,
    columnSizing: newColumnSizing,
    effectiveColumns,
    normalizedColumns,
    pinnedColumnOffsets,
    pinnedColumnPartition,
    sorting: newSorting,
  };
};
