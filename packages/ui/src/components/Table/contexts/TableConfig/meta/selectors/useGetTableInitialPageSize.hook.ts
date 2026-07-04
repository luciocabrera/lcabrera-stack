import { useMetaStore } from '@repo/ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableInitialPageSize = () =>
  useMetaStore<number>((state) => state.initialPageSize);
