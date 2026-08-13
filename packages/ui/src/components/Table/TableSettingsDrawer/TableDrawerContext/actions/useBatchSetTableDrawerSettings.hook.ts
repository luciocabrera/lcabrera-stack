import { useBatchSetTableSettings } from '#ui/components/Table/contexts/TableConfig/columns/actions';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';
import { buildBatchTableSettingsUpdate } from './buildBatchTableSettingsUpdate.util';

/**
 * Commits every drawer draft to the table at once — the Accept half of the
 * Accept/Cancel pair. Batching is what stops intermediate state updates
 * firing effects between individual setter calls.
 *
 * Both drafts go into a **single** `useBatchSetTableSettings` call rather than
 * one call each. Column state and grouping persist through the same
 * `persist-table-state` fetcher, and a second submission on a fetcher key
 * aborts the one in flight (`router.fetch` calls `abortFetcher(key)` first), so
 * two calls would drop one of the two commits and still cost a navigation
 * apiece.
 */
export const useBatchSetTableDrawerSettings = () => {
  const { columnsStore, groupingStore } = useTableDrawerContextValue();
  const batchSetTableSettings = useBatchSetTableSettings();

  return () => {
    const columnsState = columnsStore.get();

    batchSetTableSettings({
      grouping: groupingStore.get(),
      settings: buildBatchTableSettingsUpdate(columnsState),
    });
  };
};
