import { useDataStore } from '../useDataStore.hook.ts';

export const useGetTableHasMore = () =>
  useDataStore<boolean>((state) => state.hasMore);
