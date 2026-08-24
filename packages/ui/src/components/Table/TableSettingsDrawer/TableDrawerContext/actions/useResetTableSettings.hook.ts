import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';
import { buildBatchTableSettingsUpdate } from './buildBatchTableSettingsUpdate.util';

/**
 * The grouping draft is re-seeded here too, and that is what makes Cancel cancel a
 * grouping edit.
 */
export const useResetTableSettings = () => {
  const { columnsStore, groupingStore } = useTableConfigContextValue();
  const {
    columnsStore: columnsDrawerStore,
    groupingStore: groupingDrawerStore,
  } = useTableDrawerContextValue();

  return () => {
    const columnsState = columnsStore.get();
    const { aggregates, keys, mode, periods, shares } = groupingStore.get();

    columnsDrawerStore.set(buildBatchTableSettingsUpdate(columnsState));
    groupingDrawerStore.set({ aggregates, keys, mode, periods, shares });
  };
};
