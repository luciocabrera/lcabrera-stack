import { useColumnDrawerContextValue } from '@/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';
import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { getColumnPinSide } from '@/components/Table/utils';

/**
 * Resets the column pinning in the drawer to match the current table state.
 */
export const useResetColumnPinning = () => {
  const { columnsStore } = useTableConfigContextValue();
  const { columnStore } = useColumnDrawerContextValue();

  return () => {
    const columnKey = columnStore.get()?.columnKey;

    if (!columnKey) {
      console.warn(
        '[useResetColumnPinning] No columnKey found in column drawer store.',
      );
      return;
    }

    const columnPinning = getColumnPinSide(
      columnsStore.get()?.columnPinning,
      columnKey,
    );

    columnStore.set({ columnPinning });
  };
};
