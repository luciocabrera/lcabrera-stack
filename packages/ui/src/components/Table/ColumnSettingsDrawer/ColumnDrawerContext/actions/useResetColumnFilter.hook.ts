import { useColumnDrawerContextValue } from '#ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { logger } from '#ui/utils/logger';

/**
 * Resets the column filter in the drawer to match the current table state.
 */
export const useResetColumnFilter = () => {
  const { columnsStore } = useTableConfigContextValue();
  const { columnStore } = useColumnDrawerContextValue();

  return () => {
    const columnKey = columnStore.get()?.columnKey;

    if (!columnKey) {
      logger.warn(
        '[useResetColumnFilter] No columnKey found in column drawer store.',
      );
      return;
    }

    const allColumnFilters = columnsStore.get()?.columnFilters;
    const columnFilter =
      allColumnFilters && Object.hasOwn(allColumnFilters, columnKey)
        ? allColumnFilters[columnKey]
        : undefined;

    columnStore.set({ columnFilter });
  };
};
