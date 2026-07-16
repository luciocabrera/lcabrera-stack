import { useColumnsStore } from '@repo/ui/components/Table/contexts/TableConfig/columns/useColumnsStore.hook';

/** Selector for the pre-computed column groups (left-pinned, center, right-pinned). */
export const useGetColumnGroups = () =>
  useColumnsStore((state) => state.columnGroups);
