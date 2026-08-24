import { useListDataStore } from '../useListDataStore.hook';

export const useGetIsLoadingOptions = () =>
  useListDataStore<boolean>((state) => state.isLoading || state.isLoadingMore);
