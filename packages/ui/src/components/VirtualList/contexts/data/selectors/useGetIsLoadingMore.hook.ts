import { useListDataStore } from '../useListDataStore.hook';

export const useGetIsLoadingMore = () =>
  useListDataStore<boolean>((state) => state.isLoadingMore);
