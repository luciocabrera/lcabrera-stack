import { useExpansionStore } from '#ui/components/Table/contexts/TableConfig/expansion/useExpansionStore.hook';

export const useGetTableCollapsedGroupPaths = () =>
  useExpansionStore((state) => state.collapsedGroupPaths);
