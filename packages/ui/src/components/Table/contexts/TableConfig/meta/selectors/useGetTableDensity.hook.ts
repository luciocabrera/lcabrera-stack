import { useMetaStore } from '#ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableDensity = () => useMetaStore((state) => state.density);
