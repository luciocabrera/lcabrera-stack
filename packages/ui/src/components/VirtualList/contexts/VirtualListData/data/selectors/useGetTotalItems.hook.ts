import { useListDataStore } from '../useListDataStore.hook';

/** Total virtualized rows: filtered options plus the optional Select All row. */
export const useGetTotalItems = () =>
  useListDataStore<number>((state) => state.totalItems);
