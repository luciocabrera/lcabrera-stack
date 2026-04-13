import { useDataStore } from '../useDataStore.hook.ts';

export const useGetTableIsLoading = () =>
  useDataStore<boolean>((state) => state.isLoading);
