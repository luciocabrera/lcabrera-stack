import { useListDataStore } from '../useListDataStore.hook';

export const useGetIsLoading = () =>
  useListDataStore<boolean>((state) => state.isLoading);
