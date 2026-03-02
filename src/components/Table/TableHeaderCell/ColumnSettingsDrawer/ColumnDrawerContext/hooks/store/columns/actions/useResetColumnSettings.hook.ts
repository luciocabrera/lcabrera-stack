import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useColumnDrawerContextValue } from '../../../useColumnDrawerContextValue.hook';

/**
 * Resets the drawer state back to the current table state for this column.
 */
export const useResetColumnSettings = () => {
  const { columnsStore } = useTableConfigContextValue();
  const { columnStore } = useColumnDrawerContextValue();

  return () => {
    const columnsState = columnsStore.get();
    const columnKey = columnStore.get()?.columnKey;

    if (!columnKey) {
      console.warn(
        '[useResetColumnSettings] No columnKey found in column drawer store.',
      );
      return;
    }

    const allColumnFilters = columnsState?.columnFilters;
    const columnFilter =
      allColumnFilters && Object.hasOwn(allColumnFilters, columnKey)
        ? // eslint-disable-next-line security/detect-object-injection -- Safe: guarded by Object.hasOwn
          allColumnFilters[columnKey]
        : undefined;

    const allColumnSizing = columnsState?.columnSizing;
    const columnSizing =
      allColumnSizing && Object.hasOwn(allColumnSizing, columnKey)
        ? // eslint-disable-next-line security/detect-object-injection -- Safe: guarded by Object.hasOwn
          allColumnSizing[columnKey]
        : undefined;

    const sorting = columnsState?.sorting.find(
      (sort) => sort.columnKey === columnKey,
    )?.direction;

    columnStore.set({
      columnFilter,
      columnKey,
      columnSizing,
      sorting,
    });
  };
};
