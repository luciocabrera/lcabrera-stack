import { useListDataStore } from '../useListDataStore.hook';

/** Whether the initial options load is in flight. */
export const useGetIsLoading = () =>
  useListDataStore<boolean>((state) => state.isLoading);
