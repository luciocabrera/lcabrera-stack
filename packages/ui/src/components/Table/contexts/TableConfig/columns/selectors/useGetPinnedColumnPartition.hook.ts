import { useColumnsStore } from '@lcabrera/ui/components/Table/contexts/TableConfig/columns/useColumnsStore.hook';

/** Selector for the pre-computed column groups (left-pinned, center, right-pinned). */
export const useGetPinnedColumnPartition = () =>
  useColumnsStore((state) => state.pinnedColumnPartition);
