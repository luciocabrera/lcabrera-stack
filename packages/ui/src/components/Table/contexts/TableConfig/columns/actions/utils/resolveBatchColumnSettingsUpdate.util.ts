import type {
  DataKey,
  TableColumn,
  TableColumnAggregate,
  TableColumnsState,
} from '#ui/components/Table/Table.types';
import type { ColumnFilter } from '#ui/types/filterOperators.types';
import type { SortDirection } from '#ui/types/ui.types';

import {
  deriveColumnViewState,
  getColumnPinSide,
  syncColumnOrderWithPinning,
} from '#ui/components/Table/utils';
import { getNewColumnFiltersBasedOnColumnKey } from '#ui/components/Table/utils/getNewColumnFiltersBasedOnColumnKey.util';
import { getNewColumnSizingBasedOnColumnKey } from '#ui/components/Table/utils/getNewColumnSizingBasedOnColumnKey.util';
import { getNewPinningBasedOnColumnKey } from '#ui/components/Table/utils/getNewPinningBasedOnColumnKey.util';
import { getNewSortingBasedOnColumnKey } from '#ui/components/Table/utils/getNewSortingBasedOnColumnKey.util';

import { toDeclaredColumnKey } from './toDeclaredColumnKey.util';

export type BatchColumnSettingsUpdate<TData> = {
  readonly columnFilter?: ColumnFilter;
  readonly columnKey: DataKey<TData>;
  readonly columnPinning?: 'left' | 'right';
  readonly columnSizing?: number;
  readonly sorting?: SortDirection;
};

type ResolveBatchColumnSettingsUpdateArgs<TData> = {
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columnsState?: Partial<TableColumnsState<TData>>;
  readonly groupingKeys: readonly string[];
  readonly settings: BatchColumnSettingsUpdate<TData>;
};

export const resolveBatchColumnSettingsUpdate = <TData>({
  aggregates,
  columnsState,
  groupingKeys,
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

  const pinningKey = toDeclaredColumnKey<TData>({ columnKey, columns });

  const newPinning = getNewPinningBasedOnColumnKey<TData>({
    columnKey: pinningKey,
    columnPinning,
    existingPinning: columnsState?.columnPinning,
    staticKeys: columnsState?.staticKeys,
  });

  const previousColumnPinning = getColumnPinSide<TData>({
    columnKey: pinningKey,
    pinning: columnsState?.columnPinning,
  });

  const newColumnOrder =
    previousColumnPinning === columnPinning
      ? (columnsState?.columnOrder ?? columns.map((column) => column.key))
      : syncColumnOrderWithPinning<TData>({
          columnKey: pinningKey,
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
    aggregates,
    columnOrder: newColumnOrder,
    columnPinning: newPinning,
    columns,
    columnSizing: newColumnSizing,
    groupingKeys,
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
