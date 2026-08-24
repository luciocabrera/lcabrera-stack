import { useColumnsStore } from '#ui/components/Table/contexts/TableConfig/columns/useColumnsStore.hook';

export const useGetPinnedColumnOffsets = () =>
  useColumnsStore((state) => state.pinnedColumnOffsets);
