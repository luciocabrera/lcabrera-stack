import { useDataStore } from '../useDataStore.hook';

export const useGetTableHasMore = () =>
  useDataStore<boolean>((state) => state.hasMore);
