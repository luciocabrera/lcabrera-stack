import { useListDataStore } from '../useListDataStore.hook';

/** Whether an infinite-scroll page fetch is in flight. */
export const useGetIsLoadingMore = () =>
  useListDataStore<boolean>((state) => state.isLoadingMore);
