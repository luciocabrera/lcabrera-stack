import { useBatchSetColumnSettings } from '@/components/Table/contexts/TableConfig/columns/actions';

import { useColumnDrawerContextValue } from '../../../useColumnDrawerContextValue.hook';

/**
 * Hook to batch update all table settings at once.
 * Passes the flat drawer values to the table-level batch setter,
 * which handles merging them into the full table state.
 */
export const useBatchSetColumnDrawerSettings = () => {
  const { columnStore } = useColumnDrawerContextValue();
  const batchSetColumnSettings = useBatchSetColumnSettings();

  return () => {
    const columnState = columnStore.get();

    if (!columnState) return;

    const { columnFilter, columnKey, columnSizing, sorting } = columnState;

    batchSetColumnSettings({
      columnFilter,
      columnKey,
      columnSizing,
      sorting,
    });
  };
};
