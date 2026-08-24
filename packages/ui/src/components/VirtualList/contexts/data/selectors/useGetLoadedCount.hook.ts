import { useListDataStore } from '../useListDataStore.hook';

export const useGetLoadedCount = () =>
  useListDataStore<number>((state) => state.data.length);
