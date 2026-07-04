import { useMetaStore } from '@repo/ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableDensity = () => useMetaStore((state) => state.density);
