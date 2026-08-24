import { useListDataStore } from '../useListDataStore.hook';

export const useGetHasMore = () =>
  useListDataStore<boolean>((state) => state.hasMore);
