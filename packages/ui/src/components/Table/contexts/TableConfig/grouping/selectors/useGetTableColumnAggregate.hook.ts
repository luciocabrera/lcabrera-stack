import { useGroupingStore } from '#ui/components/Table/contexts/TableConfig/grouping/useGroupingStore.hook';

/** The aggregate applied to one column, or `undefined` when none is. */
export const useGetTableColumnAggregate = (columnKey: string) =>
  useGroupingStore((state) => state.aggregates[columnKey]);
