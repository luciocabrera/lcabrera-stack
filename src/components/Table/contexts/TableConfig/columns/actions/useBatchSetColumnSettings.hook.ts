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
  columnFilter?: ColumnFilter;
  /** Column key being updated */
  columnKey: string;
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
    const { columnFilter, columnKey, columnSizing, sorting } = settings;

    // Sorting: update in-place to preserve order, or remove if undefined
    const existingSorting = columnsState?.sorting ?? [];
    const existingIndex = existingSorting.findIndex(
      (s) => s.columnKey === columnKey,
    );

    const hasExistingSort = existingIndex !== -1;

    const newSorting = sorting
      ? hasExistingSort
        ? existingSorting.map((s) =>
            s.columnKey === columnKey ? { columnKey, direction: sorting } : s,
          )
        : [...existingSorting, { columnKey, direction: sorting }]
      : existingSorting.filter((s) => s.columnKey !== columnKey);

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
