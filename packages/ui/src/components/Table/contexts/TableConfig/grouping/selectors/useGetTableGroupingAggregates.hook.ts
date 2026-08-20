import { useGroupingStore } from '#ui/components/Table/contexts/TableConfig/grouping/useGroupingStore.hook';

/**
 * Every aggregate applied to the table, in order.
 *
 * It hands back the state's own array rather than a per-column slice, and that
 * is load-bearing: `useSyncExternalStore` compares snapshots with `Object.is`,
 * so a selector filtering to one column would build a fresh array on every read
 * and re-render forever. Narrowing to a column is the caller's job, on a
 * reference this returns unchanged until the configuration actually changes.
 */
export const useGetTableGroupingAggregates = () =>
  useGroupingStore((state) => state.aggregates);
