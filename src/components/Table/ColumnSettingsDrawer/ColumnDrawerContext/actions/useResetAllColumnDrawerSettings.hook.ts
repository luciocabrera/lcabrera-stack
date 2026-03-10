import { useColumnDrawerContextValue } from '@/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';
import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

/**
 * Resets all column drawer settings from the current table state without closing the drawer.
 */
export const useResetAllColumnDrawerSettings = () => {
  const { columnsStore } = useTableConfigContextValue();
  const { columnStore } = useColumnDrawerContextValue();

  return () => {
    const columnKey = columnStore.get()?.columnKey;

    if (!columnKey) return;

    const columnsState = columnsStore.get();

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

    const currentPinning = columnsState?.columnPinning;
    const columnPinning = currentPinning?.left.includes(columnKey)
      ? 'left'
      : currentPinning?.right.includes(columnKey)
        ? 'right'
        : undefined;

    columnStore.set({
      columnFilter,
      columnKey,
      columnPinning,
      columnSizing,
      sorting,
    });
  };
};
