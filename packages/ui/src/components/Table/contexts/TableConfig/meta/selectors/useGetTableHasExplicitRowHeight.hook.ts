import { useMetaStore } from '#ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableHasExplicitRowHeight = () =>
  useMetaStore((state) => state.rowHeight !== undefined);
