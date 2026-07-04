import { useDataStore } from '../useDataStore.hook';

export const useGetTableTotalLoadedRows = () =>
  useDataStore<number>((state) => state.totalLoadedRows);
