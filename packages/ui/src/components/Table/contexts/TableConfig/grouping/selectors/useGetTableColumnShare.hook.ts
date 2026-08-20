import { useGroupingStore } from '#ui/components/Table/contexts/TableConfig/grouping/useGroupingStore.hook';

/** Whether this column renders its measure as a share of the grand total. */
export const useGetTableColumnShare = (columnKey: string) =>
  useGroupingStore((state) => state.shares.includes(columnKey));
