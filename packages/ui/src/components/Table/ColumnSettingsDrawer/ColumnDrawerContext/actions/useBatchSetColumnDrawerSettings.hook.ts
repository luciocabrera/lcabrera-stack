import { useColumnDrawerContextValue } from '@lcabrera/ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';
import { useBatchSetColumnSettings } from '@lcabrera/ui/components/Table/contexts/TableConfig/columns/actions';

/**
 * Hook to batch update all table settings at once.
 * Passes the flat drawer values to the table-level batch setter,
 * which handles merging them into the full table state.
 */
export const useBatchSetColumnDrawerSettings = <TData>() => {
  const { columnStore } = useColumnDrawerContextValue<TData>();
  const batchSetColumnSettings = useBatchSetColumnSettings<TData>();

  return () => {
    const columnState = columnStore.get();

    if (!columnState) return;

    const { columnFilter, columnKey, columnPinning, columnSizing, sorting } =
      columnState;

    batchSetColumnSettings({
      columnFilter,
      columnKey,
      columnPinning,
      columnSizing,
      sorting,
    });
  };
};
