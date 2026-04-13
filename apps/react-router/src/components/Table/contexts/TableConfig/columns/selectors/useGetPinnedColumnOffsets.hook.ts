import { useColumnsStore } from '@/components/Table/contexts/TableConfig/columns/useColumnsStore.hook';

/** Selector for the pre-computed pinned column offset map. */
export const useGetPinnedColumnOffsets = () =>
  useColumnsStore((state) => state.pinnedColumnOffsets);
