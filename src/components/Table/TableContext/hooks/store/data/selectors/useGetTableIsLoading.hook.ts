import { useDataStore } from '../useDataStore.hook';

export const useGetTableIsLoading = () =>
  useDataStore<boolean>((state) => state.isLoading);
