import { useMetaStore } from '#ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableColumnGroupingCapability = (columnKey: string) =>
  useMetaStore((state) => state.groupingCapabilities?.[columnKey]);
