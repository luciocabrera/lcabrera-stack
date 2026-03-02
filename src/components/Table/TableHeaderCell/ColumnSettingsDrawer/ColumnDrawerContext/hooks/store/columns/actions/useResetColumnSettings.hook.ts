import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useColumnDrawerContextValue } from '../../../useColumnDrawerContextValue.hook';

// TODO: We need to filter the values for the current column

export const useResetColumnSettings = () => {
  const { columnsStore } = useTableConfigContextValue();
  const { columnStore: columnsDrawerStore } = useColumnDrawerContextValue();

  return () => {
    const columnsState = columnsStore.get();
    const columnKey = columnsDrawerStore.get()?.columnKey;

    if (!columnKey) {
      console.warn(
        '[useResetColumnSettings] No columnKey found in column drawer store. Cannot reset settings.',
      );
      return;
    }

    const allColumnFilters = columnsState?.columnFilters;
    const filterValue =
      allColumnFilters && Object.hasOwn(allColumnFilters, columnKey)
        ? allColumnFilters[columnKey]
        : undefined;

    const allColumnSizing = columnsState?.columnSizing;
    const columnWidth =
      allColumnSizing && Object.hasOwn(allColumnSizing, columnKey)
        ? allColumnSizing[columnKey]
        : undefined;

    const columnSorting = columnsState?.sorting.find(
      (sort) => sort.columnKey === columnKey,
    ) ?? { columnKey, direction: undefined };

    columnsDrawerStore.set({
      columnFilters: filterValue ? { [columnKey]: filterValue } : {},
      columnKey,
      columnSizing:
        columnWidth === undefined ? {} : { [columnKey]: columnWidth },
      sorting: columnSorting,
    });
  };
};
