import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

/**
 * Hook to sort all sortable columns by their current column order.
 * Creates ascending sort entries for every sortable column,
 * ordered by the current column order (or definition order as fallback).
 */
export const useSortByColumnOrder = () => {
  const { columnsStore } = useTableConfigContextValue();
  const { columnsStore: columnsDrawerStore } = useTableDrawerContextValue();

  return () => {
    const columnsState = columnsStore.get();
    const drawerState = columnsDrawerStore.get();
    const columnOrder = drawerState?.columnOrder ?? [];

    const sortableColumns =
      columnsState?.columns.filter(
        (col) => col.isSortable !== false && col.key !== 'actions',
      ) ?? [];

    const orderedSortable =
      columnOrder.length > 0
        ? columnOrder
            .map((key) => sortableColumns.find((col) => col.key === key))
            .filter(
              (col): col is (typeof sortableColumns)[0] => col !== undefined,
            )
        : sortableColumns;

    const sorting = orderedSortable.map((col) => ({
      columnKey: col.key,
      direction: 'asc' as const,
    }));

    columnsDrawerStore.set({
      sorting,
    });
  };
};
