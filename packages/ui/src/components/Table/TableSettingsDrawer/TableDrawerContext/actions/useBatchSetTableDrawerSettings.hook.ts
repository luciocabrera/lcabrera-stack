import { useBatchSetTableSettings } from '#ui/components/Table/contexts/TableConfig/columns/actions';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';
import { buildBatchTableSettingsUpdate } from './buildBatchTableSettingsUpdate.util';

/**
 * Hook to batch update all table settings at once
 * This prevents intermediate state updates that could trigger effects
 * between individual setter calls
 */
export const useBatchSetTableDrawerSettings = () => {
  const { columnsStore } = useTableDrawerContextValue();
  const batchSetTableSettings = useBatchSetTableSettings();

  return () => {
    const columnsState = columnsStore.get();

    batchSetTableSettings(buildBatchTableSettingsUpdate(columnsState));
  };
};
