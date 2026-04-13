import { useDataStore } from '../useDataStore.hook.ts';

export const useGetTableIsLoadingMore = () =>
  useDataStore<boolean>((state) => state.isLoadingMore);
