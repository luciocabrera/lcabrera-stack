import { useMetaStore } from '#ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableLockedFilters = () =>
  useMetaStore((state) => state.lockedFilters);
