import { useColumnsStore } from '#ui/components/Table/contexts/TableConfig/columns/useColumnsStore.hook';

export const useGetPinnedColumnPartition = () =>
  useColumnsStore((state) => state.pinnedColumnPartition);
