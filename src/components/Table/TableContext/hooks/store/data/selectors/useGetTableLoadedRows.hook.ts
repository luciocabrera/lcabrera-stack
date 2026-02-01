import { useDataStore } from '../useDataStore.hook';

export const useGetTableLoadedRows = () =>
  useDataStore<number>((state) => state.totalLoadedRows);
