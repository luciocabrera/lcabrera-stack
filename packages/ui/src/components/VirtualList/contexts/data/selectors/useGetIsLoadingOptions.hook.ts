import { useListDataStore } from '../useListDataStore.hook';

/** Whether any options fetch (initial or page) is in flight. */
export const useGetIsLoadingOptions = () =>
  useListDataStore<boolean>((state) => state.isLoading || state.isLoadingMore);
