import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useSortByColumnOrder = () => {
  const { columnsStore } = useTableConfigContextValue();
  const { columnsStore: columnsDrawerStore } = useTableDrawerContextValue();

  return () => {
    const columnsState = columnsStore.get();
    const drawerState = columnsDrawerStore.get();
    const columnOrder = drawerState?.columnOrder ?? [];

    const sortableColumns =
      columnsState?.columns.filter(
        (col) =>
          col.key !== 'actions' && resolveColumnCapabilities(col).isSortable,
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
