import { useListDataStore } from '../useListDataStore.hook';

export const useGetTotalItems = () =>
  useListDataStore<number>((state) => state.totalItems);
