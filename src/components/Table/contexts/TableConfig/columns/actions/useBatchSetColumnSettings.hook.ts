import type {
  ColumnFiltersState,
  ColumnSizingState,
} from '@/components/Table/Table.types';
import type { ColumnFilter } from '@/types/filterOperators.types';
import type { SortDirection } from '@/types/ui.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';
import { getNormalizedColummns } from '@/components/Table/utils';

export type BatchColumnSettingsUpdate = {
  /** Single column filter value */
  columnFilter: ColumnFilter | undefined;
  /** Column key being updated */
  columnKey: string;
  /** Single column width value */
  columnSizing: number | undefined;
  /** Sort direction for this column */
  sorting: SortDirection;
};

export const useBatchSetColumnSettings = () => {
  const { columnsStore, metaStore } = useTableConfigContextValue();
  const persistTableState = usePersistTableStateAction();

  return (settings: BatchColumnSettingsUpdate) => {
    const columnsState = columnsStore.get();
    const persistenceKey = metaStore.get()?.persistenceKey ?? '';
    const { columnFilter, columnKey, columnSizing, sorting } = settings;

    // Sorting: remove existing entry for this column, re-add if direction defined
    const baseSorting = (columnsState?.sorting ?? []).filter(
      (s) => s.columnKey !== columnKey,
    );
    const newSorting = sorting
      ? [...baseSorting, { columnKey, direction: sorting }]
      : baseSorting;

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

    const normalizedColumns = getNormalizedColummns({
      columns: columnsState?.columns ?? [],
      sorting: newSorting,
    });

    persistTableState([
      {
        persistenceKey,
        searchParamKey: 'filters',
        searchParamValue:
          Object.keys(newColumnFilters).length > 0
            ? JSON.stringify(newColumnFilters)
            : undefined,
        slice: 'columnFilters',
        valueSlice: newColumnFilters,
      },
      {
        persistenceKey,
        searchParamKey: 'sort',
        searchParamValue:
          newSorting.length > 0 ? JSON.stringify(newSorting) : undefined,
        slice: 'sorting',
        valueSlice: newSorting,
      },
      {
        persistenceKey,
        slice: 'columnSizing',
        valueSlice: newColumnSizing,
      },
    ]);

    columnsStore.set({
      columnFilters: newColumnFilters,
      columnSizing: newColumnSizing,
      normalizedColumns,
      sorting: newSorting,
    });
  };
};
