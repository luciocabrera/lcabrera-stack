import { useExpansionStore } from '#ui/components/Table/contexts/TableConfig/expansion/useExpansionStore.hook';

export const useGetTableToggledGroupPaths = () =>
  useExpansionStore((state) => state.toggledGroupPaths);
