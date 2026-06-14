import type { DataKey } from '@/components/Table/Table.types';
import type { ColumnFilter } from '@/types/filterOperators.types';
import type { SortDirection } from '@/types/ui.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';
import {
  deriveColumnViewState,
  syncColumnOrderWithPinning,
} from '@/components/Table/utils';
import { getNewSortingBasedOnColumnKey } from '@/components/Table/utils/getNewSortingBasedOnColumnKey.util';
import { getNewColumnFiltersBasedOnColumnKey } from '@/components/Table/utils/getNewColumnFiltersBasedOnColumnKey.util';
import { getNewColumnSizingBasedOnColumnKey } from '@/components/Table/utils/getNewColumnSizingBasedOnColumnKey.util';
import { getNewPinningBasedOnColumnKey } from '@/components/Table/utils/getNewPinningBasedOnColumnKey.util';

import { buildPersistencePayload } from './utils';

type BatchColumnSettingsUpdate<TData> = {
  /** Single column filter value */
  columnFilter?: ColumnFilter;
  /** Column key being updated */
  columnKey: DataKey<TData>;
  /** Pin side for this column */
  columnPinning?: 'left' | 'right';
  /** Single column width value */
  columnSizing?: number;
  /** Sort direction for this column */
  sorting?: SortDirection;
};

export const useBatchSetColumnSettings = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const persistTableState = usePersistTableStateAction();

  return (settings: BatchColumnSettingsUpdate<TData>) => {
    const columnsState = columnsStore.get();
    const persistenceKey = metaStore.get()?.persistenceKey ?? '';
    const { columnFilter, columnKey, columnPinning, columnSizing, sorting } =
      settings;
    const columns = columnsState?.columns ?? [];

    const newSorting = getNewSortingBasedOnColumnKey<TData>({
      columnKey,
      sorting,
      existingSorting: columnsState?.sorting,
    });

    const newColumnFilters = getNewColumnFiltersBasedOnColumnKey<TData>({
      columnFiltersState: columnsState?.columnFilters,
      columnKey,
      columnFilter,
    });

    const newColumnSizing = getNewColumnSizingBasedOnColumnKey<TData>({
      columnKey,
      columnSizing,
      columnSizesState: columnsState?.columnSizing,
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

    persistTableState(
      buildPersistencePayload<TData>({
        columnFilters: newColumnFilters,
        columnOrder: newColumnOrder,
        columnPinning: newPinning,
        columnSizing: newColumnSizing,
        persistenceKey,
        sorting: newSorting,
      }),
    );

    columnsStore.set({
      columnFilters: newColumnFilters,
      columnGroups,
      columnOrder: newColumnOrder,
      columnPinning: newPinning,
      columnSizing: newColumnSizing,
      effectiveColumns,
      normalizedColumns,
      pinnedColumnOffsets,
      sorting: newSorting,
    });
    metaStore.set({ isColumnSettingsOpen: false });
  };
};
