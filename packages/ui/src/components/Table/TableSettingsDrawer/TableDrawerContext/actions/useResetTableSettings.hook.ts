import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';
import { buildBatchTableSettingsUpdate } from './buildBatchTableSettingsUpdate.util';

/**
 * Re-seeds every drawer draft from the live table state — the discard half of
 * the Accept/Cancel pair.
 *
 * The grouping draft is re-seeded here too, and that is what makes Cancel
 * cancel a grouping edit. It writes only the drawer's own stores, so discarding
 * costs no navigation and no loader run however many edits were staged.
 */
export const useResetTableSettings = () => {
  const { columnsStore, groupingStore } = useTableConfigContextValue();
  const {
    columnsStore: columnsDrawerStore,
    groupingStore: groupingDrawerStore,
  } = useTableDrawerContextValue();

  return () => {
    const columnsState = columnsStore.get();
    const { aggregates, keys, mode } = groupingStore.get();

    columnsDrawerStore.set(buildBatchTableSettingsUpdate(columnsState));
    groupingDrawerStore.set({ aggregates, keys, mode });
  };
};
