import { useMetaStore } from '@lcabrera/ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableLoadMorePageSize = () =>
  useMetaStore<number>((state) => state.loadMorePageSize);
