import { useMetaStore } from '@/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableLoadMorePageSize = () =>
  useMetaStore<number>((state) => state.loadMorePageSize);
