import { useListDataStore } from '../useListDataStore.hook';

/** Number of options loaded so far. */
export const useGetLoadedCount = () =>
  useListDataStore<number>((state) => state.data.length);
