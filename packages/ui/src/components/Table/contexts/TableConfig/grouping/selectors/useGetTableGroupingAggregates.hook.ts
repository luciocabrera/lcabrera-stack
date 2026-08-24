import { useGroupingStore } from '#ui/components/Table/contexts/TableConfig/grouping/useGroupingStore.hook';

/**
 * It hands back the state's own array rather than a per-column slice, and that is
 * load-bearing: `useSyncExternalStore` compares snapshots with `Object.is`, so a selector
 * filtering to one column would build a fresh array on every read and re-render forever.
 */
export const useGetTableGroupingAggregates = () =>
  useGroupingStore((state) => state.aggregates);
