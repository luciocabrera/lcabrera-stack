import { useBatchSetTableSettings } from '#ui/components/Table/contexts/TableConfig/columns/actions';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';
import { buildBatchTableSettingsUpdate } from './buildBatchTableSettingsUpdate.util';

/**
 * Column state and grouping persist through the same `persist-table-state` fetcher, and a
 * second submission on a fetcher key aborts the one in flight (`router.fetch` calls
 * `abortFetcher(key)` first), so two calls would drop one of the two commits and still
 * cost a navigation apiece.
 */
export const useBatchSetTableDrawerSettings = () => {
  const { columnsStore, groupingStore, totalsPlacementStore } =
    useTableDrawerContextValue();
  const batchSetTableSettings = useBatchSetTableSettings();

  return () => {
    const columnsState = columnsStore.get();

    batchSetTableSettings({
      grouping: groupingStore.get(),
      settings: buildBatchTableSettingsUpdate(columnsState),
      totalsPlacement: totalsPlacementStore.get().totalsPlacement,
    });
  };
};
