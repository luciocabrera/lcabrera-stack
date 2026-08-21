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

export type BatchColumnSettingsUpdate<TData> = {
  readonly columnFilter?: ColumnFilter;
  readonly columnKey: DataKey<TData>;
  readonly columnPinning?: 'left' | 'right';
  readonly columnSizing?: number;
  readonly sorting?: SortDirection;
};

type ResolveBatchColumnSettingsUpdateArgs<TData> = {
  /** The applied aggregates — see `getPinnedDerivedColumnsState`. */
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columnsState?: Partial<TableColumnsState<TData>>;
  /** The applied group keys — see `getPinnedDerivedColumnsState`. */
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
