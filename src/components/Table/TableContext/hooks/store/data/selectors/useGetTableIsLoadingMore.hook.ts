import { useDataStore } from '../useDataStore.hook';

export const useGetTableIsLoadingMore = () =>
  useDataStore<boolean>((state) => state.isLoadingMore);