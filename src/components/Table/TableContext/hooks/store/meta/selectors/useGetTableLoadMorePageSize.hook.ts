import { useMetaStore } from '@/components/Table/TableContext/hooks/store/meta/useMetaStore.hook';

export const useGetTableLoadMorePageSize = () =>
  useMetaStore<number>((state) => state.loadMorePageSize);