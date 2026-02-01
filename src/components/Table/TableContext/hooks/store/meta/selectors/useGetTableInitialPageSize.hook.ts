import { useMetaStore } from '@/components/Table/TableContext/hooks/store/meta/useMetaStore.hook';

export const useGetTableInitialPageSize = () =>
  useMetaStore<number>((state) => state.initialPageSize);
