import type { SortingState } from '@/components/Table/Table.types';

import { useGetColumns } from '@/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

/**
 * Hook to sort all sortable columns by their current column order.
 * Creates ascending sort entries for every sortable column,
 * ordered by the current column order (or definition order as fallback).
 */
export const useSortByColumnOrder = () => {
  const columns = useGetColumns();
  const { columnsStore: columnsDrawerStore } = useTableDrawerContextValue();

  return () => {
    const drawerState = columnsDrawerStore.get();
    const columnOrder = drawerState?.columnOrder ?? [];

    const sortableColumns = columns.filter((col) => col.isSortable !== false);

    const orderedSortable =
      columnOrder.length > 0
        ? columnOrder
            .map((key) => sortableColumns.find((col) => col.key === key))
            .filter(
              (col): col is (typeof sortableColumns)[0] => col !== undefined,
            )
        : sortableColumns;

    columnsDrawerStore.set({
      sorting: orderedSortable.map((col) => ({
        columnKey: col.key,
        direction: 'asc' as const,
      })) as SortingState,
    });
  };
};
