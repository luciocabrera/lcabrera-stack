import { useListDataStore } from '../useListDataStore.hook';

/** Whether more options can be fetched via infinite scroll. */
export const useGetHasMore = () =>
  useListDataStore<boolean>((state) => state.hasMore);
