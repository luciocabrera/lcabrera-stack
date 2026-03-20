import type {
  ColumnFiltersState,
  ColumnPinningState,
  ColumnSizingState,
} from '@/components/Table/Table.types';
import type { ColumnFilter } from '@/types/filterOperators.types';
import type { SortDirection } from '@/types/ui.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';
import { applyPin } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';
import {
  getEffectiveColumns,
  getNormalizedColumns,
  syncColumnOrderWithPinning,
} from '@/components/Table/utils';
import { serializeFiltersToURL, serializeSortingToURL } from '@/utils/urlState';

export type BatchColumnSettingsUpdate = {
  /** Single column filter value */
  columnFilter?: ColumnFilter;
  /** Column key being updated */
  columnKey: string;
  /** Pin side for this column */
  columnPinning?: 'left' | 'right' | undefined;
  /** Single column width value */
  columnSizing?: number;
  /** Sort direction for this column */
  sorting?: SortDirection;
};

export const useBatchSetColumnSettings = () => {
  const { columnsStore, metaStore } = useTableConfigContextValue();
  const persistTableState = usePersistTableStateAction();

  return (settings: BatchColumnSettingsUpdate) => {
    const columnsState = columnsStore.get();
    const persistenceKey = metaStore.get()?.persistenceKey ?? '';
    const { columnFilter, columnKey, columnPinning, columnSizing, sorting } =
      settings;

    // Sorting: update in-place to preserve order, or remove if undefined
    const existingSorting = columnsState?.sorting ?? [];
    const existingIndex = existingSorting.findIndex(
      (s) => s.columnKey === columnKey,
    );

    const hasExistingSort = existingIndex !== -1;

    let newSorting;
    if (!sorting) {
      newSorting = existingSorting.filter((s) => s.columnKey !== columnKey);
    } else if (hasExistingSort) {
      newSorting = existingSorting.map((s) =>
        s.columnKey === columnKey ? { columnKey, direction: sorting } : s,
      );
    } else {
      newSorting = [...existingSorting, { columnKey, direction: sorting }];
    }

    // Filters: remove this column entry, then re-add if filter exists
    const baseFilters = Object.fromEntries(
      Object.entries(
        (columnsState?.columnFilters ?? {}) as ColumnFiltersState,
      ).filter(([key]) => key !== columnKey),
    );
    const newColumnFilters = columnFilter
      ? { ...baseFilters, [columnKey]: columnFilter }
      : baseFilters;

    // Sizing: remove this column entry, then re-add if size exists
    const baseSizing = Object.fromEntries(
      Object.entries(
        (columnsState?.columnSizing ?? {}) as ColumnSizingState,
      ).filter(([key]) => key !== columnKey),
    );
    const newColumnSizing =
      columnSizing === undefined
        ? baseSizing
        : { ...baseSizing, [columnKey]: columnSizing };

    // Pinning: remove from both sides, then re-add respecting static column positions
    const currentPinning = columnsState?.columnPinning ?? {
      left: [],
      right: [],
    };
    const staticKeys = columnsState?.staticKeys;
    const newPinning: ColumnPinningState = columnPinning
      ? applyPin({
          columnKey,
          columnPinning: currentPinning as ColumnPinningState,
          side: columnPinning,
          staticKeys,
        })
      : {
          left: currentPinning.left.filter((k) => k !== columnKey),
          right: currentPinning.right.filter((k) => k !== columnKey),
        };

    // Column Order: sync order to reflect pinning position
    const currentOrder = columnsState?.columnOrder ?? [];
    const columns = columnsState?.columns ?? [];
    const newColumnOrder = syncColumnOrderWithPinning({
      columnKey,
      columnPinning,
      columns,
      currentOrder,
      newPinning,
    });

    const normalizedColumns = getNormalizedColumns({
      columns,
      sorting: newSorting,
    });

    const effectiveColumns = getEffectiveColumns({
      columnOrder: newColumnOrder,
      columnPinning: newPinning,
      columns,
      columnVisibility: columnsState?.columnVisibility,
    });

    persistTableState([
      {
        persistenceKey,
        searchParamKey: 'filters',
        searchParamValue: serializeFiltersToURL(newColumnFilters),
        slice: 'columnFilters',
        valueSlice: newColumnFilters,
      },
      {
        persistenceKey,
        searchParamKey: 'sort',
        searchParamValue: serializeSortingToURL(newSorting),
        slice: 'sorting',
        valueSlice: newSorting,
      },
      {
        persistenceKey,
        slice: 'columnSizing',
        valueSlice: newColumnSizing,
      },
      {
        persistenceKey,
        slice: 'columnPinning',
        valueSlice: newPinning,
      },
      {
        persistenceKey,
        slice: 'columnOrder',
        valueSlice: newColumnOrder,
      },
    ]);

    columnsStore.set({
      columnFilters: newColumnFilters,
      columnOrder: newColumnOrder,
      columnPinning: newPinning,
      columnSizing: newColumnSizing,
      effectiveColumns,
      normalizedColumns,
      sorting: newSorting,
    });
    metaStore.set({ isColumnSettingsOpen: false });
  };
};
